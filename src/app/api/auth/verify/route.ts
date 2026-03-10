import { clerkClient } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  // Authenticate the incoming request using Clerk
  const client = await clerkClient();
  const requestState = await client.authenticateRequest(req, {
    // replace example.com with your actual authorized party
    authorizedParties: ["https://multicryptoportfolio.vercel.app"],
  });

  // `userId` isn't directly present on RequestState – use `toAuth()`
  const auth = requestState.toAuth();
  const userId = auth?.userId;

  return new Response(`Authenticated request for user ${userId}`, {
    status: 200,
  });
}
