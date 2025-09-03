import { apiJSON } from "./client"

export type PostPayload = { title:string; body:string; categories:string[] }

export async function saveDraft(payload: PostPayload){
  return apiJSON<{ id:string; savedAt:number }>("/api/posts/draft", { method:"POST", body: JSON.stringify(payload) })
}

export async function publishPost(payload: PostPayload){
  return apiJSON<{ id:string; url:string }>("/api/posts/publish", { method:"POST", body: JSON.stringify(payload) })
}

