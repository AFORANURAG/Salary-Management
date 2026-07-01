import * as React from "react";
import { cn } from "../../lib/utils";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Progress value between 0 and 100 */
  value: number;
  /** Height class override – defaults to h-4 (16px) */
  heightClass?: string;
  /** Track background class */
  trackClass?: string;
  /** Fill background class */
  fillClass?: string;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      heightClass = "h-4",
      trackClass = "bg-[#f7f8fa] dark:bg-[#374151]",
      fillClass = "bg-[#3c5074] dark:bg-[#3c5074]",
      ...props
    },
    ref
  ) => {
    const clamped = Math.max(0, Math.min(100, value));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("relative w-full rounded-[24px]", heightClass, trackClass, className)}
        {...props}
      >
        <div
          className={cn(
            "absolute inset-y-[1px] left-[1px] rounded-[24px] transition-all duration-300",
            fillClass
          )}
          style={{ width: clamped > 0 ? `calc(${clamped}% - 2px)` : "0" }}
          data-testid="progress-bar-fill"
        />
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };
