/**
 * Tiny store for tracking the currently selected account in the Transactions view.
 * Used by Layout to know which account to export when on /transactions.
 */

type Listener = () => void

class ActiveAccountStore {
  private activeAccountId: string | null = null
  private listeners: Set<Listener> = new Set()

  setActiveAccount(accountId: string | null): void {
    if (this.activeAccountId === accountId) return
    this.activeAccountId = accountId
    this.notifyListeners()
  }

  getActiveAccount(): string | null {
    return this.activeAccountId
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot(): string | null {
    return this.activeAccountId
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener())
  }
}

export const activeAccountStore = new ActiveAccountStore()
