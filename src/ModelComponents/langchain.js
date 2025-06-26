import { AzureChatOpenAI } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { AzureOpenAIEmbeddings } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import pdfToText from 'react-pdftotext';

class StudyBuddyAssistant {
    constructor({
        apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY,
        azureEndpointName = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT,
        deploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT,
        embeddingsDeploymentName = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT_EMBEDDING,
        temperature = 0.3
    } = {}) {

        // LLM
        this.llm = new AzureChatOpenAI({
            azureOpenAIApiKey: apiKey,
            azureOpenAIApiInstanceName: azureEndpointName,
            azureOpenAIApiDeploymentName: deploymentName,
            azureOpenAIApiVersion: "2025-01-01-preview",
            temperature: temperature,
        });

        // Embedding model
        this.embeddings = new AzureOpenAIEmbeddings({
            azureOpenAIApiKey: apiKey,
            azureOpenAIApiInstanceName: azureEndpointName,
            azureOpenAIApiDeploymentName: embeddingsDeploymentName,
            azureOpenAIApiVersion: "2024-12-01-preview",
        });

        this.vectorStore = null;
        this.retrievalChain = null;
        this.documents = [];
    }

    async loadDocumentsFromText(documentsText) {
        // Load documents from plain text
        try {
            const mockDocuments = [
                { pageContent: documentsText, metadata: { source: "study_notes.txt", page: 1 } }
            ];

            return await this._processDocuments(mockDocuments);
        } catch (error) {
            console.error('Error loading text documents:', error);
            return false;
        }
    }

    async loadDocumentsFromPDF(file) {
        // Load documents from single PDF file
        try {
            const text = await pdfToText(file);
            const document = {
                pageContent: text,
                metadata: { source: file.name, type: 'pdf' }
            };
            return await this._processDocuments([document]);
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw error;
        }
    }

    async _processDocuments(documents) {
        // Common document processing logic
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });

        const allSplits = await textSplitter.splitDocuments(documents);
        console.log(`Splits created from new documents: ${allSplits.length}`);

        if (this.vectorStore) {
            // If the vector store already exists, add the new documents to it.
            await this.vectorStore.addDocuments(allSplits);
            this.documents.push(...allSplits);
            console.log(`New documents added. Total documents now: ${this.documents.length}`);
        } else {
            // If the vector store doesn't exist, create a new one.
            this.vectorStore = await MemoryVectorStore.fromDocuments(
                allSplits,
                this.embeddings
            );
            this.documents = allSplits;
            console.log(`New vector store created. Total documents: ${this.documents.length}`);
        }

        // Always rebuild the retrieval chain to ensure it uses the latest state of the vector store.
        await this._setupRetrievalChain();
        
        return true;
    }

    async _setupRetrievalChain() {
        // Configura la cadena de recuperación y generación
        const retriever = this.vectorStore.asRetriever({
            k: 4, // Número de documentos similares a recuperar
        });

        // Create the prompt template similar to the Python version
        const studyBuddyPrompt = ChatPromptTemplate.fromTemplate(`
        ### Role and Objective:
        You are StudyBuddy, a study assistant specialized in transforming academic notes into effective learning material.
        Your main objective is to help the user prepare for their final exam using proven study techniques.

        ### Context Instructions:
        1. **Knowledge base**: Use EXCLUSIVELY the information from the provided context
        2. **Limitations**: If the question is not covered in the context:
        - Respond: "I can't find that information in your notes. Would you like me to explore another topic?"
        - Never invent information

        ### Main Features:
        - Generate structured summaries
        - Explain complex concepts in simple ways
        - Create practice questions [T/F], [Case Study], [Essay]

        ### Relevant context:
        {context}

        ### User question:
        {question}

        ### Response (use markdown for structure):
        `);

        // Crear la cadena de procesamiento
        this.retrievalChain = RunnableSequence.from([
            {
                context: async (input) => {
                    const docs = await retriever.invoke(input.question);
                    return docs.map(doc => doc.pageContent || '').join('\n\n');
                },
                question: (input) => input.question,
            },
            studyBuddyPrompt,
            this.llm,
        ]);
    }

    async ask(question) {
        // Ask a question to the StudyBuddy assistant
        if (!this.retrievalChain) {
            return "Error: No documents have been loaded. Please load your notes first.";
        }

        try {
            const response = await this.retrievalChain.invoke({
                question: question
            });

            return response.content;
        } catch (error) {
            console.error('Error in StudyBuddy ask:', error);
            return 'Sorry, I could not process your question at this time.';
        }
    }

    async generateSummary(topic) {
        // Generate a structured summary of a specific topic
        const summaryPrompt = `Generate a complete and structured summary about "${topic}" using the Cornell method (key concepts + side notes + final summary). Use markdown for structure.`;
        return await this.ask(summaryPrompt);
    }

    async createPracticeQuestions(topic, questionType = 'mixed') {
        // Create practice questions for a topic
        const typeMapping = {
            'tf': 'True/False questions',
            'case': 'case study questions',
            'essay': 'essay development questions',
            'mixed': 'a mix of T/F, case study, and essay questions'
        };

        const practicePrompt = `Create ${typeMapping[questionType]} about "${topic}". Include correct answers and explanations. Use markdown format with numbering.`;
        return await this.ask(practicePrompt);
    }

    async askQuestion(question) {
        // Specialized method for asking questions with Q&A focused prompt
        if (!this.retrievalChain) {
            return "Error: No documents have been loaded. Please load your notes first.";
        }

        try {
            const qaPrompt = ChatPromptTemplate.fromTemplate(`
### Role and Objective:
You are StudyBuddy, a question-answering assistant. Your goal is to provide accurate, concise answers based on the provided context.

### Instructions:
1. **Answer directly** - Give clear, focused answers to the specific question asked
2. **Use context only** - Base your answer exclusively on the provided context
3. **Be concise** - Provide direct answers without unnecessary elaboration
4. **Cite sources** - When possible, reference specific parts of your notes

### Context:
{context}

### Question:
{question}

### Answer:
`);

            const retriever = this.vectorStore.asRetriever({ k: 4 });
            const qaChain = RunnableSequence.from([
                {
                    context: async (input) => {
                        const docs = await retriever.invoke(input.question);
                        return docs.map(doc => doc.pageContent || '').join('\n\n');
                    },
                    question: (input) => input.question,
                },
                qaPrompt,
                this.llm,
            ]);

            const response = await qaChain.invoke({ question: question });
            return response.content;
        } catch (error) {
            console.error('Error in Q&A:', error);
            return 'Sorry, I could not process your question at this time.';
        }
    }

    async createDiagram(topic) {
        // Specialized method for creating diagrams and visual representations
        if (!this.retrievalChain) {
            return "Error: No documents have been loaded. Please load your notes first.";
        }

        try {
            const diagramPrompt = ChatPromptTemplate.fromTemplate(`
### Role and Objective:
You are StudyBuddy, a visual learning assistant. Create ASCII diagrams, flowcharts, and visual representations to help students understand concepts.

### Instructions:
1. **Create visual representations** - Use ASCII art, flowcharts, concept maps
2. **Use markdown formatting** - Structure your diagrams with code blocks and formatting
3. **Include explanations** - Explain each part of the diagram
4. **Make it educational** - Focus on helping students visualize and understand the concept

### Context:
{context}

### Topic to visualize:
{question}

### Create a visual diagram or representation:
`);

            const retriever = this.vectorStore.asRetriever({ k: 4 });
            const diagramChain = RunnableSequence.from([
                {
                    context: async (input) => {
                        const docs = await retriever.invoke(input.question);
                        return docs.map(doc => doc.pageContent || '').join('\n\n');
                    },
                    question: (input) => input.question,
                },
                diagramPrompt,
                this.llm,
            ]);

            const response = await diagramChain.invoke({ question: topic });
            return response.content;
        } catch (error) {
            console.error('Error creating diagram:', error);
            return 'Sorry, I could not create a diagram at this time.';
        }
    }

    async generateExamQuestions(topic) {
        if (!this.retrievalChain) {
            return "Error: No documents have been loaded. Please load your notes first.";
        }

        try {
            const examPrompt = ChatPromptTemplate.fromTemplate(`
### Role and Objective:
You are an exam generator. Your task is to create a short, 3-question exam based on the provided context. Each question should be followed by its answer.

### Instructions:
1.  **Generate 3 questions** based on the most important concepts in the context.
2.  **Provide concise answers** for each question.
3.  **Format the output** clearly, with "Question:" and "Answer:" for each item.

### Context:
{context}

### Topic for Exam:
{question}

### Generated Exam:
`);

            const retriever = this.vectorStore.asRetriever({ k: 4 });
            const examChain = RunnableSequence.from([
                {
                    context: async (input) => {
                        const docs = await retriever.invoke(input.question);
                        return docs.map(doc => doc.pageContent || '').join('\n\n');
                    },
                    question: (input) => input.question,
                },
                examPrompt,
                this.llm,
            ]);

            const response = await examChain.invoke({ question: topic });
            console.log("Generated Exam Response:", response);
            return response.content;
        } catch (error) {
            console.error('Error generating exam:', error);
            return 'Sorry, I could not generate an exam at this time.';
        }
    }

    async createSummaryDetailed(topic) {
        // Enhanced summary method with detailed prompts
        if (!this.retrievalChain) {
            return "Error: No documents have been loaded. Please load your notes first.";
        }

        try {
            const summaryPrompt = ChatPromptTemplate.fromTemplate(`
### Role and Objective:
You are StudyBuddy, a summary specialist. Create comprehensive, well-structured summaries that help students learn and review effectively.

### Instructions:
1. **Use Cornell Note format** - Organize with main concepts, details, and summary
2. **Create hierarchical structure** - Use headers, subheaders, and bullet points
3. **Highlight key terms** - Use **bold** for important concepts
4. **Include examples** - Provide concrete examples from the context
5. **Add memory aids** - Include mnemonics or memory techniques when helpful

### Context:
{context}

### Topic to summarize:
{question}

### Create a comprehensive summary:
`);

            const retriever = this.vectorStore.asRetriever({ k: 4 });
            const summaryChain = RunnableSequence.from([
                {
                    context: async (input) => {
                        const docs = await retriever.invoke(input.question);
                        return docs.map(doc => doc.pageContent || '').join('\n\n');
                    },
                    question: (input) => input.question,
                },
                summaryPrompt,
                this.llm,
            ]);

            const response = await summaryChain.invoke({ question: topic });
            return response.content;
        } catch (error) {
            console.error('Error creating summary:', error);
            return 'Sorry, I could not create a summary at this time.';
        }
    }
}

// Global assistant instance
let studyBuddyInstance = null;

// Function to initialize StudyBuddy
export async function initializeStudyBuddy(documentsText = "") {
    try {
        studyBuddyInstance = new StudyBuddyAssistant();
        
        // If document text is provided, load it
        if (documentsText.trim()) {
            const success = await studyBuddyInstance.loadDocumentsFromText(documentsText);
            if (success) {
                return "✅ StudyBuddy initialized successfully with your notes.";
            } else {
                return "⚠️ StudyBuddy initialized, but there were problems loading the notes.";
            }
        }
        
        return "✅ StudyBuddy initialized.";
    } catch (error) {
        console.error('Error initializing StudyBuddy:', error);
        return "❌ Error initializing StudyBuddy: " + error.message;
    }
}

// Function to load documents
export async function loadDocuments(documentsText) {
    if (!studyBuddyInstance) {
        return "Error: StudyBuddy is not initialized. Use initializeStudyBuddy() first.";
    }
    
    const success = await studyBuddyInstance.loadDocumentsFromText(documentsText);
    return success ?
        "✅ Documents loaded successfully." :
        "❌ Error loading documents.";
}

// Function to load PDF documents
export async function loadPDFDocuments(file) {
    if (!studyBuddyInstance) {
        return "Error: StudyBuddy is not initialized. Use initializeStudyBuddy() first.";
    }
    
    const success = await studyBuddyInstance.loadDocumentsFromPDF(file);
    return success ?
        `✅ PDF "${file.name}" loaded successfully.` :
        "❌ Error loading PDF.";
}

// Function to load multiple PDF documents
export async function loadMultiplePDFDocuments(files) {
    if (!studyBuddyInstance) {
        return "Error: StudyBuddy is not initialized. Use initializeStudyBuddy() first.";
    }
    
    try {
        const success = await studyBuddyInstance.loadDocumentsFromMultiplePDFs(files);
        return success ?
            `✅ ${files.length} PDFs loaded successfully.` :
            "❌ Error loading PDFs.";
    } catch (error) {
        return `❌ Error loading PDFs: ${error.message}`;
    }
}

// Specialized question function
export async function askQuestionSpecialized(question) {
    if (!studyBuddyInstance) {
        return "Error: StudyBuddy is not initialized.";
    }
    return await studyBuddyInstance.askQuestion(question);
}

export async function generateExam(topic) {
    if (!studyBuddyInstance) {
        return "Error: StudyBuddy is not initialized.";
    }
    return await studyBuddyInstance.generateExamQuestions(topic);
}