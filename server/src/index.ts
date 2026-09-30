import { Elysia } from "elysia";

function hello(): string{
  requestLog()
  return "Hello"
}

let counter = 0;

function requestLog(){
  counter += 1
  console.log(`request count: ${counter}`)
};




const app = new Elysia()
.get("/", () => "Hello Elysia")
.get("/hello", hello)
.listen(3000);





console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
