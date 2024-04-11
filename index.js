import index from "./index.html";
import { Ai } from '@cloudflare/ai'
const ChatAIModel = "@hf/thebloke/llama-2-13b-chat-awq";
const ImageGenAIModel = "@cf/bytedance/stable-diffusion-xl-lightning";

/**
 * @typedef {Object} Env
 */

// export default {
// 	/**
// 	 * @param {Request} request
// 	 * @param {Env} env
// 	 * @param {ExecutionContext} ctx
// 	 * @returns {Promise<Response>}
// 	 */
// 	async fetch(request, env, ctx) {
// 		const url = new URL(request.url);
// 		console.log(`Hello ${navigator.userAgent} at path ${url.pathname}!`);

// 		if (url.pathname === "/api") {
// 			// You could also call a third party API here
// 			// const data = await import("./data.js");
// 			return Response.json({"hello":"world"});
// 		}
// 		return new Response(index, {
// 			headers: {
// 				"content-type": "text/html",
// 			},
// 		});
// 	},
// };
export default {
  async fetch(request, env) {
    const ai = new Ai(env.AI);
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(index, {
        headers: {
          "content-type": "text/html",
        },
      });
	} else if (url.pathname === "/test"){
		const response = await ai.run('@cf/meta/llama-2-7b-chat-int8', {
			prompt: "What is the origin of the phrase Hello, World"
		  }
		);
	
		return new Response(JSON.stringify(response));
    } else if (url.pathname === "/recipe") {
      if (request.method === "GET") {
        const userInput =
          url.searchParams.get("prompt") ||
          "Create a recipe for cake that is described as carrot cake with cream cheese frosting";

        const messages = [
          { role: "system", content: "Create a recipe" },
          { role: "user", content: userInput },
        ];

        const stream = await ai.run(ChatAIModel, {
          messages,
          stream: true,
        });

        return new Response(stream, {
          headers: { "content-type": "text/event-stream" },
        });
      } else {
        return new Response("This endpoint expects a GET request.", {
          status: 400,
        });
      }
    } else if (url.pathname === "/generate_image") {
      if (
        request.method === "POST" &&
        request.headers.get("Content-Type") === "application/json"
      ) {
        const { prompt } = await request.json();

        const inputs = {
          prompt: prompt || "large Thanksgiving dinner",
        };

        const response = await ai.run(ImageGenAIModel, inputs);

        return new Response(response, {
          headers: {
            "content-type": "image/png",
          },
        });
      } else {
        return new Response(
          "This endpoint expects a POST request with JSON payload.",
          { status: 400 }
        );
      }
    }

    return new Response("Endpoint not found.", { status: 404 });
  },
};
