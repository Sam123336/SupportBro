const axios = require('axios');
const { Groq } = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Enhanced AI Service with Groq integration
class EnhancedAIService {
    constructor() {
        this.fallbackResponses = [
            "I understand your concern. Let me help you with that.",
            "That's a great question! Here's what I can tell you:",
            "I'm here to assist you. Can you provide more details about your issue?",
            "Let me walk you through the solution step by step.",
            "I've encountered similar issues before. Here's how we can resolve this:",
            "Thank you for reaching out. I'll do my best to help you solve this problem.",
            "Based on your description, I recommend trying the following approach:",
            "That sounds frustrating. Let's work together to find a solution.",
            "I can definitely help you with that. Here are some options:",
            "Great question! This is actually a common issue that we can resolve quickly."
        ];
    }

    async searchWebForContext(query) {
        if (!process.env.TAVILY_API_KEY) {
            console.log('Tavily API key not configured, skipping web search');
            return null;
        }

        try {
            // Use Tavily API directly via HTTP request
            const response = await axios.post('https://api.tavily.com/search', {
                api_key: process.env.TAVILY_API_KEY,
                query: query,
                search_depth: "basic",
                include_answer: true,
                include_images: false,
                include_raw_content: false,
                max_results: 3
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            if (response.data && response.data.results && response.data.results.length > 0) {
                return {
                    answer: response.data.answer,
                    sources: response.data.results.map(result => ({
                        title: result.title,
                        url: result.url,
                        content: result.content.substring(0, 200) + '...'
                    }))
                };
            }
        } catch (error) {
            console.error('Error searching web with Tavily:', error.message);
        }
        return null;
    }

    async generateGroqResponse(message, webContext = null) {
        try {
            let systemPrompt = `You are a helpful AI assistant for a support ticket system. You provide clear, concise, and helpful responses to user queries. You specialize in technical support, troubleshooting, and general assistance.

Key guidelines:
- Be friendly and professional
- Provide step-by-step solutions when appropriate
- If you can't solve an issue, suggest escalating to a human agent
- Keep responses concise but informative
- Use bullet points or numbered lists for complex solutions
- Always be helpful and try to provide actionable advice`;

            if (webContext && webContext.answer) {
                systemPrompt += `\n\nAdditional context from web search:\n${webContext.answer}\n\nSources: ${webContext.sources.map(s => s.title).join(', ')}`;
            }

            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: message
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            return completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response right now.";
        } catch (error) {
            console.error('Error with Groq API:', error.message);
            return null;
        }
    }

    async generateResponseWithContext(message, webContext = null, ticket = null) {
        try {
            // Generate response using Groq
            if (process.env.GROQ_API_KEY) {
                const groqResponse = await this.generateGroqResponse(message, webContext);
                
                if (groqResponse) {
                    let response = groqResponse;
                    
                    // Add web sources if available (but don't duplicate them in the response text)
                    // Sources will be handled separately in the frontend
                    return response;
                }
            }

            // Fallback to simple response if Groq fails
            return this.getRandomFallback() + " If you need more detailed assistance, I can connect you with a human agent.";

        } catch (error) {
            console.error('Error generating AI response with context:', error);
            return "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment, or I can connect you with a human agent for immediate assistance.";
        }
    }

    shouldSearchWeb(message) {
        const webSearchKeywords = [
            'latest', 'recent', 'news', 'update', 'current', 'today',
            'how to', 'tutorial', 'guide', 'documentation',
            'error code', 'bug', 'issue with', 'problem with',
            'best practices', 'recommendations', 'learn more'
        ];
        
        const lowerMessage = message.toLowerCase();
        return webSearchKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    getRandomFallback() {
        return this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
    }

    async generateResponse(message) {
        try {
            let webContext = null;

            // Check if we should search the web for additional context
            if (this.shouldSearchWeb(message)) {
                console.log('Searching web for context...');
                webContext = await this.searchWebForContext(message);
            }

            // Generate response using Groq
            if (process.env.GROQ_API_KEY) {
                const groqResponse = await this.generateGroqResponse(message, webContext);
                
                if (groqResponse) {
                    let response = groqResponse;
                    
                    // Add web sources if available
                    if (webContext && webContext.sources && webContext.sources.length > 0) {
                        response += '\n\n📚 Additional resources:\n';
                        webContext.sources.forEach((source, index) => {
                            response += `${index + 1}. [${source.title}](${source.url})\n`;
                        });
                    }
                    
                    return response;
                }
            }

            // Fallback to simple response if Groq fails
            return this.getRandomFallback() + " If you need more detailed assistance, I can connect you with a human agent.";

        } catch (error) {
            console.error('Error generating AI response:', error);
            return "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment, or I can connect you with a human agent for immediate assistance.";
        }
    }
}

const enhancedAI = new EnhancedAIService();

async function sendMessageToAI(clientMessage, ticket = null, enableWebSearch = false) {
    try {
        // Add a small delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        let webContext = null;
        let webSearchUsed = false;

        // Check if web search should be used
        if (enableWebSearch || enhancedAI.shouldSearchWeb(clientMessage)) {
            console.log('Searching web for context...');
            webContext = await enhancedAI.searchWebForContext(clientMessage);
            webSearchUsed = true;
        }

        // Generate response with optional web context
        const response = await enhancedAI.generateResponseWithContext(clientMessage, webContext, ticket);
        
        return {
            response: response,
            webSearchUsed: webSearchUsed,
            sources: webContext?.sources || [],
            hasWebContext: !!webContext
        };
    } catch (error) {
        console.error('Error communicating with AI service:', error);
        return {
            response: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment, or I can connect you with a human agent for immediate assistance.",
            webSearchUsed: false,
            sources: [],
            hasWebContext: false
        };
    }
}

module.exports = {
    sendMessageToAI
};