import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = 
  "You are an expert technical writer. " +
  "Format your response strictly using clean Markdown " +
  "(using headers, bullet points, tables, or code fences). " +
  "Do not wrap your output with conversational filler.";

async function runBatch() {
  const requests = [
    {
      custom_id: "spring-ai-introduction",
      params: {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user" as const, content: "Summarize Spring AI ChatClient capabilities." },
        ],
      },
    },
    {
      custom_id: "spring-ai-rag-workflow",
      params: {
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user" as const, content: "Explain RAG workflow implementation in Spring Boot." },
        ],
      },
    },
  ];

  // Submit batch
  let batch = await client.messages.batches.create({ requests });
  console.log(`Created batch: ${batch.id}`);

  // Poll
  while (batch.processing_status !== "ended") {
    console.log(
      `Status: ${batch.processing_status} | Succeeded: ${batch.request_counts.succeeded}`
    );
    await new Promise((r) => setTimeout(r, 30000));
    batch = await client.messages.batches.retrieve(batch.id);
  }

  // Create folder
  const outputDir = path.join(__dirname, "markdown_outputs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let combinedMarkdown = "# All Batch Results\n\n";

  // Stream & save
  const results = await client.messages.batches.results(batch.id);
  for await (const entry of results) {
    if (entry.result.type === "succeeded") {
      const text = entry.result.message.content[0].text;
      
      // Save individual file
      const filePath = path.join(outputDir, `${entry.custom_id}.md`);
      fs.writeFileSync(filePath, text, "utf-8");
      console.log(`Saved: ${filePath}`);

      combinedMarkdown += `\n---\n\n# Document: ${entry.custom_id}\n\n${text}\n`;
    } else {
      console.error(`Failed ${entry.custom_id}:`, entry.result);
    }
  }

  // Save consolidated file
  fs.writeFileSync(path.join(outputDir, "all_combined.md"), combinedMarkdown, "utf-8");
  console.log("\nFinished saving all Markdown documents!");
}

runBatch().catch(console.error);