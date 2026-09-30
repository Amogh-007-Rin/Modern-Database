import { useRef, type MouseEvent as ReactMouseEvent } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme, type ThemeToggleOrigin } from "@/hooks/use-theme"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const clickOrigin = useRef<ThemeToggleOrigin | null>(null)
  const isDark = theme === "dark"

  const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
    // Keyboard toggles report (0, 0): fall back to the viewport center.
    clickOrigin.current =
      event.clientX === 0 && event.clientY === 0
        ? null
        : { x: event.clientX, y: event.clientY }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <Switch
        id="theme-toggle"
        checked={isDark}
        onClick={handleClick}
        onCheckedChange={() => toggleTheme(clickOrigin.current ?? undefined)}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      />
      <Label htmlFor="theme-toggle">
        <span className="sr-only">Toggle theme</span>
        {isDark ? (
          <Moon className="size-4" aria-hidden="true" />
        ) : (
          <Sun className="size-4" aria-hidden="true" />
        )}
      </Label>
    </div>
  )
}
