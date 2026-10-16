// One clock owns the video rotation. Pauses discard elapsed slots; nothing catches up.
export class AlternatingRotation {
  constructor({ change, clock = { now: () => Date.now(), set: (fn, ms) => setTimeout(fn, ms), clear: id => clearTimeout(id) } }) {
    this.change = change; this.clock = clock; this.lists = []; this.reasons = new Set();
    this.next = 0; this.slot = 0; this.cooldown = 0; this.timer = null; this.disposed = false;
  }
  configure(lists) { this.lists = lists; this.schedule(); }
  pause(reason, paused) {
    if (paused === this.reasons.has(reason)) return;
    if (paused) this.reasons.add(reason); else this.reasons.delete(reason);
    this.schedule();
  }
  interact() { this.cooldown = this.clock.now() + 20000; this.schedule(); }
  schedule() {
    this.clock.clear(this.timer); this.timer = null;
    if (this.disposed || this.reasons.size || !this.lists.some(list => list.length > 1)) return;
    this.timer = this.clock.set(() => this.tick(), Math.max(9000, this.cooldown - this.clock.now()));
  }
  tick() {
    this.timer = null;
    if (this.disposed || this.reasons.size) return;
    for (let i = 0; i < this.lists.length; i++) {
      const index = (this.next + i) % this.lists.length;
      if (this.lists[index].length > 1) {
        this.change(this.lists[index]); this.next = (index + 1) % this.lists.length; this.slot++; break;
      }
    }
    this.schedule();
  }
  destroy() { this.disposed = true; this.clock.clear(this.timer); this.timer = null; }
}
