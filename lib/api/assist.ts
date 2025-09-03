import { apiJSON } from "./client"

export async function getOutline(body:string){
  return apiJSON<{ bullets:string[] }>("/api/assist/outline", { method:"POST", body: JSON.stringify({ body }) })
}

export async function rewrite(body:string, tone:"concise"|"friendly"){
  return apiJSON<{ body:string }>("/api/assist/rewrite", { method:"POST", body: JSON.stringify({ body, tone }) })
}

export async function suggestTitles(body:string){
  return apiJSON<{ titles:string[] }>("/api/assist/titles", { method:"POST", body: JSON.stringify({ body }) })
}

