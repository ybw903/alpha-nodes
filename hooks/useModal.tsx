'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import { AlertContent, ConfirmContent, ModalShell } from '@/components/ui/Modal';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * openModal에 전달하는 설정.
 *
 * renderContent에 임의의 ReactNode를 반환할 수 있어 완전히 확장 가능.
 *
 * @example
 * // 커스텀 콘텐츠 (PromptContent 포함)
 * const name = await openModal<string | null>({
 *   title: '전략 저장',
 *   defaultCloseValue: null,
 *   renderContent: (close) => (
 *     <PromptContent
 *       message="저장할 이름을 입력하세요"
 *       defaultValue={strategyName}
 *       onConfirm={close}
 *       onCancel={() => close(null)}
 *     />
 *   ),
 * });
 */
export interface ModalConfig<T = void> {
  title?: string;
  /**
   * 모달 본문을 렌더링하는 함수.
   * close(value)를 호출하면 해당 value로 Promise가 resolve된다.
   */
  renderContent: (close: (result: T) => void) => React.ReactNode;
  /** true이면 Escape 키와 오버레이 클릭으로 닫히지 않음 (기본값: false) */
  preventClose?: boolean;
  /**
   * Escape 키 / 오버레이 클릭으로 닫힐 때 resolve되는 기본값.
   * showConfirm → false, showAlert → undefined
   */
  defaultCloseValue?: T;
}

interface ModalEntry {
  id: string;
  title?: string;
  renderContent: (close: (result: unknown) => void) => React.ReactNode;
  preventClose?: boolean;
  defaultCloseValue: unknown;
  resolve: (value: unknown) => void;
}

interface UseModalReturn {
  /** 임의 콘텐츠를 담은 모달을 열고 결과값을 Promise로 반환 */
  openModal: <T>(config: ModalConfig<T>) => Promise<T>;
  /** 메시지 + 확인 버튼 */
  showAlert: (message: string, title?: string) => Promise<void>;
  /** 메시지 + 취소/확인 버튼 */
  showConfirm: (
    message: string,
    title?: string,
    options?: { isDanger?: boolean },
  ) => Promise<boolean>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ModalContext = createContext<UseModalReturn | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [modals, setModals] = useState<ModalEntry[]>([]);

  const closeModal = useCallback((id: string, value: unknown) => {
    setModals((prev) => {
      const entry = prev.find((m) => m.id === id);
      entry?.resolve(value);
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  const openModal = useCallback(<T,>(config: ModalConfig<T>): Promise<T> => {
    return new Promise<T>((resolve) => {
      const id = crypto.randomUUID();
      const entry = {
        id,
        title: config.title,
        renderContent: config.renderContent as (close: (v: unknown) => void) => React.ReactNode,
        preventClose: config.preventClose,
        defaultCloseValue: config.defaultCloseValue,
        resolve: resolve as (v: unknown) => void,
      };

      // setTimeout으로 1 tick 지연:
      // - onClick 버튼: 클릭 시 버튼이 포커스를 받은 후 setTimeout 실행 → blur() → aria-hidden 적용 시 포커스 없음
      // - onMouseDown 버튼: mousedown 핸들러 종료 후 브라우저가 포커스를 이동시키기 전에 setTimeout 실행 → blur() → 동일
      // 두 경우 모두 Radix의 aria-hidden 적용 시점에 포커스된 엘리먼트가 없어 경고를 방지함.
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        setModals((prev) => [...prev, entry]);
      }, 0);
    });
  }, []);

  const showAlert = useCallback(
    (message: string, title?: string): Promise<void> => {
      return openModal<void>({
        title,
        defaultCloseValue: undefined,
        renderContent: (close) => (
          <AlertContent message={message} onClose={() => close(undefined)} />
        ),
      });
    },
    [openModal],
  );

  const showConfirm = useCallback(
    (
      message: string,
      title?: string,
      options?: { isDanger?: boolean },
    ): Promise<boolean> => {
      return openModal<boolean>({
        title,
        defaultCloseValue: false, // Escape / 오버레이 클릭 = 취소
        renderContent: (close) => (
          <ConfirmContent
            message={message}
            isDanger={options?.isDanger}
            onConfirm={() => close(true)}
            onCancel={() => close(false)}
          />
        ),
      });
    },
    [openModal],
  );

  return (
    <ModalContext.Provider value={{ openModal, showAlert, showConfirm }}>
      {children}
      {modals.map((entry) => (
        <ModalShell
          key={entry.id}
          title={entry.title}
          preventClose={entry.preventClose}
          onClose={() => closeModal(entry.id, entry.defaultCloseValue)}
        >
          {entry.renderContent((value) => closeModal(entry.id, value))}
        </ModalShell>
      ))}
    </ModalContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useModal(): UseModalReturn {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
