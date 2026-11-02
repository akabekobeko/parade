import { expect, it, vi } from "vitest";
import { useSpeedControl } from "./useSpeedControl";

it("derives the label, the lit state and the selected preset from the rate", () => {
  const at1 = useSpeedControl(1, () => {});
  expect(at1.label).toBe("1x");
  expect(at1.active).toBe(false);
  expect(at1.presets.find(({ selected }) => selected)?.rate).toBe(1);

  const at125 = useSpeedControl(1.25, () => {});
  expect(at125.label).toBe("1.25x");
  expect(at125.active).toBe(true);
  expect(at125.presets.find(({ selected }) => selected)?.rate).toBe(1.25);
  expect(at125.percent).toBe(125);
});

it("hands the slider value back as a rate", () => {
  const onRateChange = vi.fn();
  const control = useSpeedControl(1, onRateChange);
  control.setPercent(150);
  expect(onRateChange).toHaveBeenLastCalledWith(1.5);
  control.setPercent([75]);
  expect(onRateChange).toHaveBeenLastCalledWith(0.75);
});

it("steps one grid step slower or faster", () => {
  const onRateChange = vi.fn();
  const control = useSpeedControl(1, onRateChange);
  control.slower();
  expect(onRateChange).toHaveBeenLastCalledWith(0.95);
  control.faster();
  expect(onRateChange).toHaveBeenLastCalledWith(1.05);
});

it("disables the step button at each end only", () => {
  expect(useSpeedControl(0.25, () => {})).toMatchObject({
    slowerDisabled: true,
    fasterDisabled: false,
  });
  expect(useSpeedControl(2, () => {})).toMatchObject({
    slowerDisabled: false,
    fasterDisabled: true,
  });
});
