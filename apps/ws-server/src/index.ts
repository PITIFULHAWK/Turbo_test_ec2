import { PrismaClient } from "@prisma/client"; // Import PrismaClient
// Note: Bun's fetch API uses the standard Request type
// If you have a custom type definition for BunRequest, ensure it aligns with Request.

const client = new PrismaClient(); // Initialize Prisma Client

// Assume 'server' variable is defined here, from Bun.serve()
// This snippet assumes the surrounding Bun.serve() structure
// const server = Bun.serve({ ... });

// Define the server structure as you had it, with corrections
const server: any = Bun.serve({
  port: 3001, // Example port
  fetch: async (req: Request) => {
    // Use standard Request type for Bun's fetch API
    const url = new URL(req.url);

    if (url.pathname === "/chat") {
      console.log("Upgrade request received for /chat");

      // --- FIX 1: Parse request body correctly ---
      // req.body is a ReadableStream. For JSON, use req.json().
      // Ensure the client sends a JSON payload like: { "username": "someuser" }
      // Inside fetch handler for /chat
      const username = url.searchParams.get("username");
      if (!username) {
        return new Response("Username query parameter is required", {
          status: 400,
        });
      }
      // Then use 'username' in your Prisma query
      // ...
      const user = await client.user.findUnique({
        where: { username: username }, // Use username from query param
        select: { id: true, username: true },
      });
      // ...
      // Pass to WebSocket:
      // data: { user: { id: user.id, username: user.username } }

      // --- FIX 2: Correct Prisma 'select' option ---
      // To exclude 'password', simply omit it from the select object.
      // Prisma's 'select' only takes 'true' for inclusion.

      if (!user) {
        console.log(`User not found: `);
        return new Response("User not found", { status: 404 });
      }

      console.log("User data retrieved for WebSocket upgrade:", user);

      // --- FIX 3: Pass meaningful data to WebSocket ---
      // Pass the 'user' object (which now correctly excludes password)
      // to the WebSocket data. This object will be available as ws.data.user.
      const success: boolean = server.upgrade(req, {
        data: { user: user }, // Pass the 'user' object
      });

      return success
        ? undefined // Undefined indicates successful upgrade, Bun handles the rest
        : new Response("WebSocket upgrade error", { status: 400 });
    }

    // Default response for other paths
    return new Response("Not Found", { status: 404 });
  },

  websocket: {
    // TypeScript types for WebSocket context
    // ws.data will have the 'user' object passed during upgrade
    open(ws: {
      data: { user: { username: string } };
      subscribe: (channel: string) => void;
    }) {
      // --- FIX 4: Access username correctly from ws.data ---
      // ws.data.user is the object you passed. Access its properties.
      const msg = `${ws.data.user.username} has entered the chat`;
      console.log(msg); // Log for debugging
      ws.subscribe("the-group-chat");
      server.publish("the-group-chat", msg);
    },

    message(
      ws: { data: { user: { username: string } } },
      message: string | Buffer
    ) {
      // Ensure message is a string if you're directly concatenating
      const incomingMessage = message.toString(); // Convert Buffer to string if necessary
      // --- FIX 4: Access username correctly from ws.data ---
      const chatMessage = `${ws.data.user.username}: ${incomingMessage}`;
      console.log(`Received message: ${chatMessage}`); // Log for debugging
      server.publish("the-group-chat", chatMessage);
    },

    close(ws: {
      data: { user: { username: string } };
      unsubscribe: (channel: string) => void;
    }) {
      // --- FIX 4: Access username correctly from ws.data ---
      const msg = `${ws.data.user.username} has left the chat`;
      console.log(msg); // Log for debugging
      ws.unsubscribe("the-group-chat");
      server.publish("the-group-chat", msg);
    },

    // Optional: Add error handling for websockets
    /*     error(ws: { data: { user: { username: string } } }, error: Error) {
      console.error(
        `WebSocket error for user ${ws.data.user?.username || "unknown"}:`,
        error
      );
    }, */
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);

// Remember to call client.$disconnect() when your application shuts down
// process.on('beforeExit', async () => {
//   await client.$disconnect();
// });
