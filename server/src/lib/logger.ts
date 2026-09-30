let counter = 0;

export default function requestLog(): void {
  counter += 1;
  console.log(`request count: ${counter}`);
}