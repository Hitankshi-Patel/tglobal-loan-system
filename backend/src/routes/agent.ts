/**
 * AI Loan Assist Agent Route
 * POST /api/v1/agent/chat
 *
 * A stateless chat endpoint. Each request carries the full conversation history.
 * The agent uses Google Gemini (function calling) with a local Ollama fallback.
 *
 * 3 Tools:
 *   1. get_loan_schemes()              → lists DB-seeded plans
 *   2. calculate_quote(...)            → calls /api/v1/quotes logic server-side
 *   3. submit_application(payload)     → calls /api/v1/leads logic server-side
 *
 * Guardrails:
 *   - Stays on gold loans only
 *   - Never does arithmetic itself — all numbers from tools
 *   - Asks for explicit confirmation before submitting
 *   - Masks mobile numbers in logs
 */

import { Router } from 'express';
import { z } from 'zod';
import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { prisma } from '../lib/prisma.js';
import {
  calculateGoldMetrics,
  calculateEligibleLoan,
  getRate24k,
  maskMobileNumber,
} from '../lib/calculator.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// --------------------------------------------------------------------------
// Tool definitions (same Zod schemas as the API for consistency)
// --------------------------------------------------------------------------

const toolDeclarations = [
  {
    name: 'get_loan_schemes',
    description:
      'Fetches all active gold loan plans from the database. Always call this before describing plan options to the user. Never describe plans from memory.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'calculate_quote',
    description:
      'Calculates pure gold grams, gold value, and eligible loan amount for each active plan. Always use this tool for any calculation — never do arithmetic in the response text.',
    parameters: {
      type: 'object',
      properties: {
        netWeightGrams: {
          type: 'number',
          description: 'Net weight of gold jewellery in grams (required). Must be > 0 and ≤ 1000.',
        },
        grossWeightGrams: {
          type: 'number',
          description: 'Gross weight of gold jewellery in grams. Must be >= netWeightGrams if provided.',
        },
        karat: {
          type: 'number',
          description: 'Gold purity in karat. Must be 18, 22, or 24.',
        },
      },
      required: ['netWeightGrams', 'karat'],
    },
  },
  {
    name: 'submit_application',
    description:
      'Submits a gold loan application to the backend. MUST only be called AFTER the user has explicitly confirmed all details in the conversation. Never call this without user confirmation.',
    parameters: {
      type: 'object',
      properties: {
        fullName: { type: 'string', description: "Applicant's full name (2-60 chars, letters and spaces only)" },
        mobileNumber: { type: 'string', description: 'Indian 10-digit mobile number starting with 6-9' },
        netWeightGrams: { type: 'number', description: 'Net weight in grams' },
        grossWeightGrams: { type: 'number', description: 'Gross weight in grams' },
        karat: { type: 'number', description: 'Gold karat: 18, 22, or 24' },
        planId: { type: 'string', description: 'Loan scheme ID (e.g. PLAN_BULLET_01 or PLAN_EMI_01)' },
      },
      required: ['fullName', 'mobileNumber', 'netWeightGrams', 'karat', 'planId'],
    },
  },
];

// --------------------------------------------------------------------------
// Tool implementations (call real business logic, not the HTTP layer)
// --------------------------------------------------------------------------

async function tool_get_loan_schemes() {
  const schemes = await prisma.loanScheme.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  return schemes.map((s) => ({
    id: s.id,
    name: s.name,
    interestRateAnnual: Number(s.interestRateAnnual),
    tenureMonths: s.tenureMonths,
    maxLtv: Number(s.maxLtv),
    tenureDescription: s.tenureDescription,
  }));
}

async function tool_calculate_quote(args: {
  netWeightGrams: number;
  grossWeightGrams?: number;
  karat: 18 | 22 | 24;
}) {
  const { netWeightGrams, grossWeightGrams, karat } = args;
  const effectiveGross = grossWeightGrams ?? netWeightGrams;

  // Validate
  if (netWeightGrams <= 0 || netWeightGrams > 1000)
    return { error: 'netWeightGrams must be between 0 and 1000 grams' };
  if (effectiveGross < netWeightGrams)
    return { error: 'grossWeightGrams cannot be less than netWeightGrams' };
  if (![18, 22, 24].includes(karat))
    return { error: 'karat must be 18, 22, or 24' };

  const schemes = await prisma.loanScheme.findMany({ where: { isActive: true } });
  const rate = getRate24k();
  const metrics = calculateGoldMetrics(netWeightGrams, karat as 18 | 22 | 24, rate);

  const planQuotes = schemes.map((s) => {
    const { eligibleLoan } = calculateEligibleLoan(metrics.goldValue, Number(s.maxLtv));
    return {
      planId: s.id,
      planName: s.name,
      maxLtv: Number(s.maxLtv),
      eligibleLoan,
      interestRateAnnual: Number(s.interestRateAnnual),
      tenureMonths: s.tenureMonths,
      tenureDescription: s.tenureDescription,
    };
  });

  return {
    netWeightGrams,
    grossWeightGrams: effectiveGross,
    karat,
    pureGoldGrams: metrics.pureGoldGrams,
    goldValue: metrics.goldValue,
    rate24kPerGram: rate,
    plans: planQuotes,
  };
}

async function tool_submit_application(args: {
  fullName: string;
  mobileNumber: string;
  netWeightGrams: number;
  grossWeightGrams?: number;
  karat: 18 | 22 | 24;
  planId: string;
}) {
  const { fullName, mobileNumber, netWeightGrams, grossWeightGrams, karat, planId } = args;
  const effectiveGross = grossWeightGrams ?? netWeightGrams;

  // Validate all inputs
  const nameValid = /^[a-zA-Z\s]{2,60}$/.test(fullName.trim());
  if (!nameValid) return { error: 'fullName must be 2-60 characters, letters and spaces only' };

  const mobileValid = /^[6-9]\d{9}$/.test(mobileNumber);
  if (!mobileValid) return { error: 'mobileNumber must be a valid 10-digit Indian number starting with 6-9' };

  if (netWeightGrams <= 0 || netWeightGrams > 1000) return { error: 'netWeightGrams must be between 0 and 1000' };
  if (effectiveGross < netWeightGrams) return { error: 'grossWeightGrams cannot be less than netWeightGrams' };
  if (![18, 22, 24].includes(karat)) return { error: 'karat must be 18, 22, or 24' };

  // Check duplicate within 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const existing = await prisma.lead.findFirst({
    where: { mobileNumber, createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) {
    return {
      error: 'DUPLICATE_APPLICATION',
      existingApplicationId: existing.applicationId,
      message: `An application already exists for this mobile within 7 days. Existing ID: ${existing.applicationId}`,
    };
  }

  // Verify plan exists
  const scheme = await prisma.loanScheme.findUnique({ where: { id: planId } });
  if (!scheme || !scheme.isActive) {
    return { error: `Loan scheme '${planId}' does not exist or is not active` };
  }

  // Server-side calculation
  const rate = getRate24k();
  const metrics = calculateGoldMetrics(netWeightGrams, karat as 18 | 22 | 24, rate);
  const { eligibleLoan, eligibleLoanPaise } = calculateEligibleLoan(metrics.goldValue, Number(scheme.maxLtv));

  // Generate application ID
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const applicationId = `APP-${dateStr}-${randomSuffix}`;

  // Save to DB
  await prisma.$transaction(async (tx) => {
    await tx.lead.create({
      data: {
        applicationId,
        fullName: fullName.trim(),
        mobileNumber,
        netWeightGrams,
        grossWeightGrams: effectiveGross,
        karat,
        planId,
        pureGoldGrams: metrics.pureGoldGrams,
        goldValuePaise: metrics.goldValuePaise,
        eligibleLoanPaise,
        status: 'SUBMITTED',
      },
    });
    await tx.auditLog.create({
      data: {
        leadId: applicationId,
        previousStatus: null,
        newStatus: 'SUBMITTED',
        note: 'Application submitted via AI Loan Assist agent',
        changedBy: 'AI_AGENT',
      },
    });
  });

  return {
    success: true,
    applicationId,
    fullName: fullName.trim(),
    mobileNumber: maskMobileNumber(mobileNumber), // masked in response
    planId,
    planName: scheme.name,
    eligibleLoan,
    status: 'SUBMITTED',
  };
}

// --------------------------------------------------------------------------
// Tool executor — dispatches to the right function
// --------------------------------------------------------------------------

export async function executeTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'get_loan_schemes':
      return tool_get_loan_schemes();
    case 'calculate_quote':
      return tool_calculate_quote(args);
    case 'submit_application':
      return tool_submit_application(args);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// --------------------------------------------------------------------------
// Gemini provider
// --------------------------------------------------------------------------

export const SYSTEM_PROMPT = `You are "Loan Assist", an AI assistant for TGlobal's gold loan portal.

ROLE:
- Help borrowers understand gold loan options and file applications
- Collect required information conversationally
- Use tools for ALL calculations and data — never compute numbers yourself

RULES:
1. ONLY discuss gold loans. Politely decline off-topic questions.
2. NEVER do arithmetic. All numbers MUST come from calculate_quote or get_loan_schemes.
3. ALWAYS call get_loan_schemes before describing any plan details.
4. ONLY call submit_application AFTER the user explicitly says "yes", "confirm", "proceed", or similar.
5. Show the full quote summary and ask for confirmation BEFORE submitting.
6. Never make promises about loan approval — emphasize it's a preliminary offer.
7. Collect all required fields before submitting: fullName, mobileNumber, netWeightGrams, karat, planId.
8. Mobile numbers in your responses should be partially masked (e.g., 98XXXX7890).

TONE: Friendly, professional, helpful. Respond in the language the user writes in.`;

async function runWithGemini(
  messages: Array<{ role: 'user' | 'model'; parts: string }>,
  apiKey: string
): Promise<{ reply: string; toolsUsed: string[] }> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: toolDeclarations as any }],
  });

  // Convert history (all except last message which is the new user turn)
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.parts }] as Part[],
  }));

  const chat = model.startChat({ history });
  const userMessage = messages[messages.length - 1].parts;

  let response = await chat.sendMessage(userMessage);
  const toolsUsed: string[] = [];

  // Agentic tool-use loop
  while (response.response.functionCalls()?.length) {
    const calls = response.response.functionCalls()!;
    const toolResults: Part[] = [];

    for (const call of calls) {
      toolsUsed.push(call.name);
      const result = await executeTool(call.name, call.args);
      toolResults.push({
        functionResponse: {
          name: call.name,
          response: { result },
        },
      } as any);
    }

    response = await chat.sendMessage(toolResults);
  }

  return {
    reply: response.response.text(),
    toolsUsed,
  };
}

// --------------------------------------------------------------------------
// Ollama fallback provider (OpenAI-compatible API)
// --------------------------------------------------------------------------

async function runWithOllama(
  messages: Array<{ role: 'user' | 'model'; parts: string }>
): Promise<{ reply: string; toolsUsed: string[] }> {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';

  // Convert to OpenAI format
  const ollamaMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.parts,
    })),
  ];

  const ollamaTools = toolDeclarations.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  const toolsUsed: string[] = [];
  let currentMessages = [...ollamaMessages];

  // Agentic loop for Ollama
  for (let i = 0; i < 5; i++) {
    const response = await fetch(`${ollamaBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        messages: currentMessages,
        tools: ollamaTools,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama error: ${response.status} ${errorText}`);
    }

    const data = await response.json() as any;
    const choice = data.choices?.[0];
    const msg = choice?.message;

    if (!msg) break;

    currentMessages.push(msg);

    // Check for tool calls
    if (msg.tool_calls?.length) {
      for (const tc of msg.tool_calls) {
        const fnName = tc.function.name;
        const fnArgs = JSON.parse(tc.function.arguments || '{}');
        toolsUsed.push(fnName);

        const result = await executeTool(fnName, fnArgs);
        currentMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        } as any);
      }
    } else {
      // Final text response
      return { reply: msg.content || '', toolsUsed };
    }
  }

  return { reply: 'I was unable to process your request. Please try again.', toolsUsed };
}

// --------------------------------------------------------------------------
// Request schema
// --------------------------------------------------------------------------

const chatRequestSchema = z.object({
  messages: z
    .array(
      z
        .object({
          role: z.string(),
          parts: z.string().optional(),
          content: z.string().optional(),
          text: z.string().optional(),
        })
        .transform((m) => {
          const text = m.content || m.parts || m.text || '';
          const role: 'user' | 'model' = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
          return { role, parts: text };
        })
    )
    .min(1, 'At least one message is required'),
});

// --------------------------------------------------------------------------
// POST /api/v1/agent/chat
// --------------------------------------------------------------------------

router.post('/chat', async (req, res, next) => {
  try {
    const parseResult = chatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      throw new AppError(400, 'VALIDATION_ERROR', issue.message, []);
    }

    const { messages } = parseResult.data;
    const geminiKey = process.env.GEMINI_API_KEY?.trim();

    let result: { reply: string; toolsUsed: string[] };
    let provider: string;

    if (geminiKey) {
      try {
        result = await runWithGemini(messages, geminiKey);
        provider = 'gemini';
      } catch (geminiError: any) {
        console.warn('[Agent] Gemini failed, falling back to Ollama:', geminiError?.message);
        try {
          result = await runWithOllama(messages);
          provider = 'ollama-fallback';
        } catch (ollamaErr: any) {
          console.warn('[Agent] Ollama fallback also failed:', ollamaErr?.message);
          result = {
            reply: [
              "I'm unable to connect to the AI service right now.",
              '',
              'To use the AI assistant, please set up one of:',
              '• **Gemini**: Add `GEMINI_API_KEY` to your `.env` file',
              '• **Ollama**: Install Ollama locally and run `ollama pull llama3.2`',
              '',
              'In the meantime, you can use the **Start Application** form to apply directly.',
            ].join('\n'),
            toolsUsed: [],
          };
          provider = 'none';
        }
      }
    } else {
      try {
        result = await runWithOllama(messages);
        provider = 'ollama';
      } catch (ollamaError: any) {
        // Both providers failed — return helpful message
        console.warn('[Agent] Ollama also failed:', ollamaError?.message);
        result = {
          reply: [
            "I'm unable to connect to the AI service right now.",
            '',
            'To use the AI assistant, please set up one of:',
            '• **Gemini**: Add `GEMINI_API_KEY` to your `.env` file',
            '• **Ollama**: Install Ollama locally and run `ollama pull llama3.2`',
            '',
            'In the meantime, you can use the **Start Application** form to apply directly.',
          ].join('\n'),
          toolsUsed: [],
        };
        provider = 'none';
      }
    }

    res.status(200).json({
      reply: result.reply,
      toolsUsed: result.toolsUsed,
      provider,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
