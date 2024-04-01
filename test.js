import * as dotenv from "dotenv";
import client from "./client";
dotenv.config();


client.login(process.env.DISCORD_TOKEN)