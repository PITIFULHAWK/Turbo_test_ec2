import { client } from "@repo/db/client";

export default async function Home() {
  const user = await client.user.findFirst();

  return (
    <div>
      UserName: {user?.username}
      Password: {user?.password}
kshujdfikusdhfiujhedrsijghbdfjikbfglkjhgbhkujftb
<h1>TEST FOR PROD</h1>
    </div>
  );
}
