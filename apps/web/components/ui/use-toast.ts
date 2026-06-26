"use client";

import * as React from "react";

export type ToastVariant = "default" | "destructive" | "success";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type ToastAction =
  | { type: "ADD"; toast: Toast }
  | { type: "REMOVE"; id: string };

interface ToastState {
  toasts: Toast[];
}

const listeners: Array<(state: ToastState) => void> = [];
let state: ToastState = { toasts: [] };

function dispatch(action: ToastAction) {
  switch (action.type) {
    case "ADD":
      state = { toasts: [action.toast, ...state.toasts].slice(0, 3) };
      break;
    case "REMOVE":
      state = { toasts: state.toasts.filter((t) => t.id !== action.id) };
      break;
  }
  listeners.forEach((l) => l(state));
}

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

export function toast(props: Omit<Toast, "id">) {
  const id = genId();
  const duration = props.duration ?? 4000;

  dispatch({ type: "ADD", toast: { ...props, id } });

  setTimeout(() => {
    dispatch({ type: "REMOVE", id });
  }, duration);

  return id;
}

export function useToast() {
  const [toastState, setToastState] = React.useState<ToastState>(state);

  React.useEffect(() => {
    listeners.push(setToastState);
    return () => {
      const idx = listeners.indexOf(setToastState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return { toasts: toastState.toasts, toast, dismiss: (id: string) => dispatch({ type: "REMOVE", id }) };
}
