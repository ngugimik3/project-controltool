export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "btn btp",
  secondary: "btn bts",
  danger: "btn btd",
  ghost: "btn btg",
};

export function buttonClass(variant: ButtonVariant = "primary"): string {
  return buttonVariants[variant];
}
