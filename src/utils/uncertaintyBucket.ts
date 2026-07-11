export default function uncertaintyBucket(
  u_qualifier: string,
): "certain" | "probably" | "uncertain" {
  if (u_qualifier === "") return "certain";
  return u_qualifier === "?" ? "probably" : "uncertain";
}
