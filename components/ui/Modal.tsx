'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';

// ─── Shell ────────────────────────────────────────────────────────────────────
// Radix Dialog 래퍼. overlay + 컨테이너 + 타이틀만 담당.
// 실제 내용(body)은 children으로 자유롭게 전달.

export interface ModalShellProps {
  title?: string;
  /** true이면 Escape 키와 오버레이 클릭으로 닫히지 않음 */
  preventClose?: boolean;
  /** 모달이 닫힐 때 호출 (Escape 키 / 오버레이 클릭) */
  onClose: () => void;
  children: React.ReactNode;
}

export function ModalShell({ title, preventClose = false, onClose, children }: ModalShellProps) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[101] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-(--color-border-default) bg-(--color-bg-elevated) shadow-2xl focus:outline-none"
          onEscapeKeyDown={(e) => {
            if (preventClose) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (preventClose) e.preventDefault();
          }}
        >
          {/* title이 없을 때도 Dialog.Title은 반드시 존재해야 함 (Radix 접근성 요구사항) */}
          <Dialog.Title
            className={
              title
                ? 'border-b border-(--color-border-subtle) px-5 py-3.5 text-sm font-semibold text-foreground'
                : 'sr-only'
            }
          >
            {title ?? 'Dialog'}
          </Dialog.Title>
          <Dialog.Description className="sr-only">Modal dialog</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Shared button styles ─────────────────────────────────────────────────────

const btn = 'px-3 py-1.5 text-xs font-medium rounded-md transition-colors';
export const btnCancel = `${btn} border border-(--color-border-default) text-(--color-text-secondary) hover:text-foreground`;
export const btnPrimary = `${btn} bg-(--color-accent) text-white hover:bg-(--color-accent-hover)`;
export const btnDanger = `${btn} bg-(--color-danger) text-white hover:opacity-90`;

// ─── Pre-built content components ─────────────────────────────────────────────
// 기본 Alert / Confirm / Prompt 용. openModal의 renderContent에 직접 사용.
// 커스텀 모달은 ModalShell 없이 openModal에 임의 ReactNode를 전달하면 됨.

export function AlertContent({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <>
      <p className="whitespace-pre-line px-5 py-4 text-sm text-(--color-text-secondary)">
        {message}
      </p>
      <div className="flex justify-end px-5 pb-5">
        <button className={btnPrimary} autoFocus onClick={onClose}>
          확인
        </button>
      </div>
    </>
  );
}

export function ConfirmContent({
  message,
  isDanger = false,
  onConfirm,
  onCancel,
}: {
  message: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <p className="whitespace-pre-line px-5 py-4 text-sm text-(--color-text-secondary)">
        {message}
      </p>
      <div className="flex justify-end gap-2 px-5 pb-5">
        <button className={btnCancel} onClick={onCancel}>
          취소
        </button>
        <button className={isDanger ? btnDanger : btnPrimary} autoFocus onClick={onConfirm}>
          확인
        </button>
      </div>
    </>
  );
}

export function PromptContent({
  message,
  defaultValue = '',
  onConfirm,
  onCancel,
}: {
  message: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <>
      <div className="space-y-3 px-5 py-4">
        <p className="text-sm text-(--color-text-secondary)">{message}</p>
        <input
          type="text"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onConfirm(value);
            }
          }}
          className="w-full rounded-md border border-(--color-border-default) bg-(--color-bg-surface) px-3 py-2 text-sm text-(--color-text-primary) placeholder:text-(--color-text-muted) transition-colors focus:border-(--color-border-strong) focus:outline-none"
        />
      </div>
      <div className="flex justify-end gap-2 px-5 pb-5">
        <button className={btnCancel} onClick={onCancel}>
          취소
        </button>
        <button className={btnPrimary} onClick={() => onConfirm(value)}>
          확인
        </button>
      </div>
    </>
  );
}
