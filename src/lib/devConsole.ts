export default function devConsole(...args: string[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(args.join(" "));
  }
}
