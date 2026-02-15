# khlone v0.0: replbuffer + shell-native

> instant input, ask or act, then return

---

## scope

this document covers **chain1** — the first value chain link:

```
v0.0: replbuffer + shell-native  ← THIS DOCUMENT
  │
  └── local foundation (no infra required)
      ├── replbuffer: instant input, queue, crash recovery, headless
      └── shell-native: ask/act, --who, --when, --watch, --talk
```

no zones, no remote provision, no cloud. just you and your local repls, tamed.

---

## the outcome world

### before

```
$ claude-code
[10 seconds to load...]
[type "implement auth"]
[ui freezes while it thinks]
[try to type next thought — keystrokes lag, get lost]
[claude-code crashes mid-task]
[restart, re-explain context, hope it remembers]
[laptop fans spin, terminal unresponsive]
[switch terminals — same sluggishness]
["let me close some stuff" — hourly ritual]
[force-quit, lose work, start over]
```

you paid for those tokens. you lose work because the tui crashed.

### after

```
$ khlone act "implement auth"
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
$ _                              # instant, shell is yours

$ khlone act "add tests"         # queue more while first runs
✓ enqueued to mechanic.1 (zone: ~/code/myproject)

$ khlone ask "what files changed?" --watch
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
[stream] mechanic.1: check git diff...
[stream] mechanic.1: 3 files changed: auth.ts, jwt.ts, auth.test.ts
^C
$ _                              # ctrl+c, back to shell

$ khlone status
zone: ~/code/myproject (local)
mechanic.1: active (67%) — implement auth
queue: 1 task

# repl crashed? you didn't notice — khlone restarted it, resumed queue
# laptop stays cool, terminal stays responsive
# work survives crashes — queue persists, context preserved
```

### the "aha" moment

you're deep in a feature. you `khlone act "refactor the auth module"` and immediately think of three more tasks. you type them all — instant, no wait. they queue up. you walk away to get coffee.

when you return: first two done, third in progress. the repl crashed once on "add tests" — you didn't notice because khlone restarted it and continued. your laptop never broke a sweat. you type `khlone ask "what files changed?" --watch` and see the answer stream in.

the repl is no longer in your way. your shell is yours.

---

## user experience

### usecase 1: basic ask/act flow

**goal**: send tasks to a clone without wait

```sh
# act on a task, get your shell back
$ khlone act "implement jwt validation"
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
$ _                              # shell is yours

# session auto-resumes in same shell
$ echo $KHLONE_SESSION
abc123

# queue more tasks (they stack up)
$ khlone act "add tests"
✓ enqueued to mechanic.1 (zone: ~/code/myproject)

$ khlone act "update readme"
✓ enqueued to mechanic.1 (zone: ~/code/myproject)

# ask a question
$ khlone ask "what files changed?"
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
$ _

# ask with immediate answer (disrupt current work)
$ khlone ask "status?" --when disrupt
✓ sent to mechanic.1 [disrupt]
mechanic.1: active (67%) — implement jwt validation
$ _
```

### usecase 2: watch output

**goal**: observe clone progress without interactive talk

```sh
# ask and watch the response stream
$ khlone ask "explain the auth flow" --watch
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
[stream] mechanic.1: the auth flow works as follows...
[stream] mechanic.1: 1. user submits credentials...
[stream] mechanic.1: 2. server validates via jwt...
^C                               # ctrl+c stops stream
$ _                              # back to shell

# act and watch progress
$ khlone act "refactor db queries" --watch
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
[stream] mechanic.1: read src/db/queries.ts
[stream] mechanic.1: edit src/db/queries.ts (optimize joins)
[stream] mechanic.1: edit src/db/queries.ts (add index hints)
^C
$ _

# or just watch current activity
$ khlone watch
[~/code/myproject] mechanic.1: refactor db queries (34%)
  ├─ read src/db/queries.ts
  ├─ edit src/db/queries.ts
  └─ active: optimize join queries...
^C
$ _
```

### usecase 3: target specific clones

**goal**: direct work to specific clones

```sh
# act on default clone (clone.0, usually mechanic.1)
$ khlone act "implement auth"
✓ enqueued to mechanic.1 (zone: ~/code/myproject)

# act on specific clone
$ khlone act "review the auth" --who reviewer.1
✓ enqueued to reviewer.1 (zone: ~/code/myproject)

# ask specific clone
$ khlone ask "what's your progress?" --who architect.1
✓ enqueued to architect.1 (zone: ~/code/myproject)

# check crew status
$ khlone crew
zone: ~/code/myproject (local)
role          brain       status         queue
─────────────────────────────────────────────────
mechanic.1    claude      active (67%)   2 tasks
reviewer.1    claude      active (12%)   1 task
architect.1   claude      idle           0 tasks
```

### usecase 4: crash recovery

**goal**: survive repl crashes without lost work

```sh
$ khlone status
zone: ~/code/myproject (local)
mechanic.1: active (67%) — refactor auth module
queue: 2 tasks

# repl crashes (you may not even notice)

$ khlone status
zone: ~/code/myproject (local)
mechanic.1: restarted (crash detected, resumed from checkpoint)
  current: refactor auth module (67%)
queue: 2 tasks

# automatic recovery — you didn't have to do any work
# queue persists, checkpoint enables resume
```

### usecase 5: interactive talk

**goal**: drop into interactive session when needed

```sh
# talk as a flag on ask/act
$ khlone act "refactor the auth module" --talk
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
[talk — mechanic.1 @ ~/code/myproject]

# now you're in the clone's session, you guide the work
> focus on the jwt validation first
[clone works...]

> what files did you change?
[clone responds...]

> /exit
$ _                              # back to shell

# or standalone talk (drop into active clone)
$ khlone talk mechanic.1
[talk — mechanic.1 @ ~/code/myproject]
> show me the current diff
[clone responds...]
> /exit
$ _
```

### usecase 6: queue management

**goal**: manage the task queue

```sh
# view queue
$ khlone queue
1. [active 67%] refactor auth module
2. [queued] add integration tests
3. [queued] update api docs

# add to front of queue (priority)
$ khlone act "hotfix: fix prod bug" --priority
✓ enqueued at position 2 (after current)

# pause queue (finish current, hold rest)
$ khlone queue pause
✓ queue paused after current task

# resume queue
$ khlone queue resume
✓ queue resumed
```

### usecase 7: task completion artifacts

**goal**: deterministic task track with completion summaries

```sh
# each task is tracked with deterministic artifacts
$ khlone status
zone: ~/code/myproject (local, worktree: feature-auth)

mechanic.1: idle
  recent:
  ├─ [done] implement jwt validation
  │  └─ summary: added jwt.ts with sign/verify, integrated into auth flow
  │  └─ complete: yes
  │  └─ tokens: 12,847
  ├─ [done] add tests
  │  └─ summary: added 6 unit tests for jwt sign/verify, all pass
  │  └─ complete: yes
  │  └─ tokens: 8,234
  └─ [active] refactor db queries

queue: 0 tasks
```

**how it works**:
- each task (ask/act) is tracked deterministically
- on task completion, hooks fire to capture artifacts:
  - `summary`: clone provides brief summary of what happened
  - `complete`: clone confirms if task was fully done
  - `tokens`: token count for the episode
- artifacts are stored with the task in `.khlone/.bind.worksite/task.yml`
- `khlone status` shows recent tasks with their artifacts

**configurable hooks** (in `khlone.worksite.yml`):
```yaml
hooks:
  onStop:                     # fires when task episode ends
    - prompt: "provide a 1-line summary of what you did"
      artifact: summary
    - prompt: "was this task fully completed? yes/no/partial"
      artifact: complete
```

### usecase 8: transcript review

**goal**: review full transcript, token account

```sh
# view current session transcript
$ khlone log
[mechanic.1 @ ~/code/myproject]
[2024-02-12 09:15:23] act: implement jwt validation
[2024-02-12 09:15:24] clone: read src/auth/index.ts
[2024-02-12 09:15:26] clone: created src/auth/jwt.ts
[2024-02-12 09:17:41] clone: completed (tokens: 12,847)
[2024-02-12 09:17:42] act: add tests
...

# export to markdown
$ khlone log --export > session-transcript.md
```

### usecase 9: cross-zone dispatch

**goal**: work with any zone from any terminal, not just your cwd

```sh
# from anywhere — specify full zone address
$ khlone act 'respond to pr feedback' --zone ehmpathy/myrepo@feature-auth
✓ enqueued to mechanic.1 (zone: ehmpathy/myrepo@feature-auth)
$ _

# within same org — omit org
$ khlone ask 'what tests are flaky?' --zone rhachet@main
✓ enqueued to mechanic.1 (zone: ehmpathy/rhachet@main)

# within same repo — just branch
$ khlone act 'fix the lint errors' --zone @hotfix-typo
✓ enqueued to mechanic.1 (zone: ehmpathy/myrepo@hotfix-typo)

# spin up a fresh zone on the fly (no prior init)
$ khlone ask 'how does genContextBrain work?' --zone ehmpathy/rhachet@main
✓ init: zone bound to ehmpathy/rhachet@main
✓ enqueued to mechanic.1 (zone: ehmpathy/rhachet@main)
```

**zone address format**: `org/repo@branch`
- full: `ehmpathy/rhachet@main`
- same org: `rhachet@main`
- same repo: `@feature-branch`

### usecase 10: await + pipe output

**goal**: wait for completion, capture output artifact, pipe to file

```sh
# await completion, pipe output to file
$ khlone act 'describe how genContextBrain should be used' \
    --zone ehmpathy/rhachet@main \
    --await \
    >> .refs/howto.rhachet.genContextBrain.md
✓ init: zone bound to ehmpathy/rhachet@main
✓ enqueued to mechanic.1 (zone: ehmpathy/rhachet@main)
[await] mechanic.1: active...
[await] mechanic.1: done (tokens: 4,521)
# output artifact written to stdout, piped to file
$ _

# await with watch (see progress while you wait)
$ khlone ask 'summarize the auth implementation' --await --watch
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
[stream] mechanic.1: read src/auth/index.ts
[stream] mechanic.1: read src/auth/jwt.ts
[await] mechanic.1: done
The auth implementation uses JWT tokens with...
$ _

# capture to variable
$ SUMMARY=$(khlone ask 'one-line summary of recent changes' --await)
$ echo $SUMMARY
Added jwt validation and fixed login redirect bug.
```

**`--await`**: blocks until task completes, emits output artifact to stdout. shell pipe just works.

### usecase 11: multi-terminal workflow

**goal**: work with multiple clones across multiple terminals

```sh
# terminal 1: start the main task with watch
$ khlone act 'fulfill this milestone .behavior/vision.src' --watch
✓ init: zone bound to ~/code/myproject (worktree: feature-auth)
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
[stream] mechanic.1: read .behavior/vision.src
[stream] mechanic.1: plan milestone...
...                             # stays open, streams output

# terminal 2: spawn a researcher clone inline, ask a question
$ khlone ask 'what do you think about x?' --who researcher++
✓ spawned researcher.1 (zone: ~/code/myproject)
✓ enqueued to researcher.1 (zone: ~/code/myproject)
$ _                             # back to shell

# terminal 3: add more work to the default clone (mechanic.1)
$ khlone act 'also, consider xyz. add it to the vision'
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
$ _                             # back to shell

# any terminal: see full worksite state
$ khlone crew
zone: ~/code/myproject (local, worktree: feature-auth)
role          brain       status         queue
─────────────────────────────────────────────────
mechanic.1    claude      active (34%)   2 tasks
researcher.1  claude      active (12%)   1 task
```

**how it works**:
- first `khlone act` triggers implicit `khlone init`
- init binds the worktree via `.khlone/.bind.worksite/`
- subsequent terminals in same worktree see the same zone, crew, tasks
- `--who role++` spawns inline (role must be defined in `khlone.worksite.yml`)

---

## contract summary

### commands

| command | behavior |
|---------|----------|
| `khlone init` | read `khlone.worksite.yml`, provision zone for this worktree |
| `khlone ask "..."` | queue question, return to shell (implicit init on first call) |
| `khlone act "..."` | queue action, return to shell (implicit init on first call) |
| `khlone ask "..." --who CLONE` | ask specific clone (e.g., `--who mechanic.1`) |
| `khlone act "..." --who CLONE` | act on specific clone |
| `khlone ask "..." --who role++` | spawn new clone with role, ask it (e.g., `--who researcher++`) |
| `khlone act "..." --who role++` | spawn new clone with role, act on it |
| `khlone ask "..." --when disrupt` | interrupt for immediate answer |
| `khlone ask "..." --watch` | queue, then stream output |
| `khlone act "..." --watch` | queue, then stream output |
| `khlone act "..." --priority` | queue at front |
| `khlone ask "..." --zone ADDR` | dispatch to zone by address |
| `khlone ask "..." --await` | wait for completion, emit output to stdout |
| `khlone ask "..." --await >> file` | await + pipe output to file |
| `khlone status` | snapshot of zone + clone status |
| `khlone watch` | live progress (ctrl+c to exit) |
| `khlone talk CLONE` | interactive mode with clone (standalone) |
| `khlone ask "..." --talk` | queue, then interactive mode |
| `khlone act "..." --talk` | queue, then interactive mode |
| `khlone crew` | list clones in zone |
| `khlone queue` | list queue |
| `khlone worksite` | list all zones in the worksite (org/repo) |
| `khlone log` | view transcript |

### flags

| flag | purpose |
|------|---------|
| `--who CLONE` | target specific clone (e.g., `--who mechanic.1`) |
| `--who role++` | spawn new clone with role, target it (e.g., `--who researcher++`) |
| `--when enqueue` | add to queue (default) |
| `--when disrupt` | interrupt current work, handle now |
| `--watch` | queue then stream output (passive observe) |
| `--talk` | queue then interactive mode (active converse) |
| `--await` | block until task completes, emit output to stdout |
| `--zone ADDR` | target zone by address (e.g., `org/repo@branch`) |
| `--priority` | queue at front (after current task) |

### envvars

| envvar | purpose |
|--------|---------|
| `KHLONE_SESSION` | current session id (auto-set on ask/act) |
| `KHLONE_WHO` | default clone for ask/act (optional) |
| `KHLONE_WHEN` | default: enqueue or disrupt (default: enqueue) |

### config

```yaml
# khlone.worksite.yml (per repo, at gitroot)
zone:
  mode: local                 # local | remote
  constraints:
    cost_limit: 50            # alert at $50

crew:
  clone.0: mechanic           # default clone role
  defaults:
    brain: claude
  limits:
    max_clones: 4

roles:                        # role aliases available for --who role++
  mechanic: ehmpathy/mechanic # alias -> fully qualified (repo/role)
  researcher: ehmpathy/researcher
  reviewer: ehmpathy/reviewer
  auditor: acme/auditor       # can mix roles from different repos
```

### implicit init + worksite bind

first `khlone ask` or `khlone act` triggers implicit `khlone init`:

```sh
# first act in a worktree — init happens under the hood
$ khlone act "implement auth"
✓ init: zone bound to ~/code/myproject (worktree: feature-auth)
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
$ _

# subsequent acts skip init (already bound)
$ khlone act "add tests"
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
```

what happens on implicit init:

1. **read config** — find `khlone.worksite.yml` at gitroot
2. **resolve worktree** — detect branch + worktree path
3. **bind worksite** — create `.khlone/.bind.worksite/` in worktree
4. **spawn clone.0** — start default clone per crew config

worksite bind files:

```
{worktree}/.khlone/.bind.worksite/
├── zone.yml      # zone config snapshot (mode, constraints)
├── crew.yml      # active clones (role, brain, pid, status)
└── task.yml      # enqueued tasks (asks + acts, queue order)
```

**multi-terminal awareness**: any terminal in the same worktree reads `.bind.worksite/` to know the zone state. no orphan clones, no lost tasks — state is shared via filesystem.

**role init**: `--who role++` spawns a clone with the specified role alias. alias resolves to fully qualified name (e.g., `mechanic` → `ehmpathy/mechanic`). rhachet knows how to init each role (briefs, skills, hooks). aliases must be defined in `khlone.worksite.yml` roles map.

```sh
# terminal 1: first act, triggers init
$ khlone act "implement auth"
✓ init: zone bound to ~/code/myproject

# terminal 2 (same worktree): sees the bound zone
$ khlone status
zone: ~/code/myproject (local, worktree: feature-auth)
mechanic.1: active (34%) — implement auth
```

---

## mental model

### how you'd describe khlone to a friend

> "khlone is a buffer between me and claude code. i type `ask` or `act` — instant, no lag. the command queues and i'm back in my shell. claude code runs headless in the background, no ui overhead. i can `--watch` to stream output, or `--talk` to interact directly. if it crashes, khlone restarts it and keeps my queue. my laptop stays cool, my shell stays mine."

### analogies

| analogy | fit |
|---------|-----|
| **print spooler** | queue tasks, they execute in order, survive crashes |
| **tmux for ai** | session persists, talk/exit freely, survives disconnects |
| **email outbox** | write messages, they send when ready |
| **job queue** | act work, check status, manage priority |

### the key insight

brain repls (claude-code, opencode) are built for interactive use. they assume you're focused on them.

khlone inverts this:
- **your input** → instant (local buffer, 0ms)
- **brain repl** → async (headless, background)
- **observation** → opt-in (--watch, --talk)

you act, then return. interactive is optional.

### worksite / zone hierarchy

```
worksite (org/repo)                    # the repo — shared config, role aliases
├── zone (@main)                       # worktree 1 — independent crew + tasks
│   └── crew (mechanic.1, reviewer.1)
├── zone (@feature-auth)               # worktree 2 — independent crew + tasks
│   └── crew (mechanic.1, researcher.1)
└── zone (@hotfix-typo)                # worktree 3 — independent crew + tasks
    └── crew (mechanic.1)
```

**worksite** = org/repo level
- `khlone.worksite.yml` lives at gitroot
- defines defaults: zone mode, crew config, role aliases
- shared across all zones (worktrees) of that repo

**zone** = worktree level
- each worktree is an independent zone
- has its own crew, tasks, state (`.khlone/.bind.worksite/`)
- isolated execution — mechanic.1 in `@feature-auth` ≠ mechanic.1 in `@main`

**crew** = clones in a zone
- each zone has its own crew of clones
- clones are role instances (mechanic.1, researcher.1, reviewer.1)
- `--who role++` spawns a new clone in the current zone

```sh
# see all zones in the worksite
$ khlone worksite
worksite: ehmpathy/myrepo
zones:
  @main           local    mechanic.1 (idle)
  @feature-auth   local    mechanic.1 (active 67%), researcher.1 (idle)
  @hotfix-typo    local    mechanic.1 (active 12%)
```

### terms map

| user might say | khlone term |
|----------------|-------------|
| "run this task" | `khlone act "..."` |
| "ask it a question" | `khlone ask "..."` |
| "what's it up to" | `khlone status` / `khlone watch` |
| "queue more work" | `khlone act "..."` (stacks) |
| "show me output" | `khlone ask "..." --watch` |
| "let me talk to it" | `khlone act "..." --talk` or `khlone talk` |
| "go back to shell" | `ctrl+c` or `/exit` |
| "do this next" | `khlone act "..." --priority` |
| "spin up a researcher" | `khlone ask "..." --who researcher++` |
| "send to mechanic.1" | `khlone act "..." --who mechanic.1` |
| "who's on the crew" | `khlone crew` |
| "what zones exist" | `khlone worksite` |
| "what did it do" | `khlone status` (shows recent tasks with summaries) |
| "is it done" | `khlone status` (shows complete: yes/no/partial per task) |
| "it crashed" | (khlone auto-recovers, you may not notice) |
| "work on another repo" | `khlone act "..." --zone org/repo@branch` |
| "wait and give me the output" | `khlone ask "..." --await` |
| "pipe to file" | `khlone ask "..." --await >> file.md` |

---

## evaluation

### how well does it solve the goals?

| goal | solved? |
|------|---------|
| instant input | yes — 0ms keystrokes, input goes to local buffer |
| shell stays yours | yes — ask/act returns immediately |
| resource consumption reduced | yes — headless mode, no electron/tui overhead |
| survive crashes | yes — queue persists, checkpoint enables resume |
| work while repl is busy | yes — queue stacks tasks |
| see progress without noise | yes — watch streams filtered output |
| access raw repl when needed | yes — --talk flag gives direct access |
| zone awareness | yes — always shows which zone (auto-resolved from cwd) |
| token account | yes — transcript archived per clone |
| task visibility | yes — deterministic artifacts (summary, complete) per task |
| cross-zone dispatch | yes — `--zone org/repo@branch` from any terminal |
| shell-native output | yes — `--await` emits to stdout, pipe just works |

### pros

| benefit | details |
|---------|---------|
| instant input | 0ms keystroke latency — no brain repl lag |
| shell stays yours | ask/act and return, don't get trapped |
| queue tasks | don't wait for completion to act next |
| crash recovery | auto-restart, resume from checkpoint |
| headless efficiency | repls run without ui overhead |
| watch output | stream without interactive talk |
| talk anytime | drop into interactive session when needed |
| transcript archive | review what happened, token account |
| task artifacts | deterministic summary + completion status per task |
| no infra required | works locally, no provision needed |
| same ux extends to remote | foundation for zone mode |
| cross-zone dispatch | work with any zone from any terminal |
| shell-native output | `--await` + pipe to files, capture to variables |

### cons / edgecases

| edgecase | mitigation |
|----------|------------|
| checkpoint accuracy | conservative checkpoints, may redo some work |
| headless mode support | not all repls support it — fallback to hidden window |
| output filter quality | start simple (progress %), improve over time |
| multi-clone resource use | headless helps, but still multiple processes |
| repl api stability | abstract via adapters, handle cli changes |

### pit of success

| risk | mitigation |
|------|------------|
| forget which zone | zone always shown in output, auto-resolved from cwd |
| forget session context | `$KHLONE_SESSION` envvar auto-set, resumes in same shell |
| lose work on crash | queue persists, checkpoint enables resume |
| repl hangs terminal | repl is headless, your shell is never blocked |
| lose transcript | archived to worktree `.khlone/` automatically |
| orphan clones across terminals | `.bind.worksite/` shared, all terminals see same state |
| forgot to init | implicit init on first ask/act |
| spawn unknown role | role++ only works for aliases defined in `khlone.worksite.yml` roles map |

---

## architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  khlone v0.0: replbuffer + shell-native         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   YOU ──► shell ──► khlone ask/act ──► queue ──► repl (headless)│
│              │              │             │            │        │
│              │              │             │            │        │
│              ▼              ▼             ▼            ▼        │
│         shell yours    instant      persists      low resource  │
│                                                                 │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐  │
│   │ shell-native│     │ replbuffer  │     │ repl processes  │  │
│   │             │────►│             │────►│                 │  │
│   │ • ask/act   │     │ • queue     │     │ ┌─────────────┐ │  │
│   │ • --who     │     │ • persist   │     │ │claude-code  │ │  │
│   │ • --when    │     │ • checkpoint│     │ │(headless)   │ │  │
│   │ • --watch   │     │ • recover   │     │ └─────────────┘ │  │
│   │ • envvar    │     │ • transcript│     │ ┌─────────────┐ │  │
│   │             │     │ • artifacts │     │ │opencode     │ │  │
│   └─────────────┘     └─────────────┘     │ │(headless)   │ │  │
│         │                   │             │ └─────────────┘ │  │
│         ▼                   ▼             └─────────────────┘  │
│   ┌─────────────────────────────────────────────┐              │
│   │               output stream                  │              │
│   │  • watch (filtered progress)                │              │
│   │  • talk (interactive session)               │              │
│   │  • log (transcript review)                  │              │
│   └─────────────────────────────────────────────┘              │
│                                                                 │
│   STATE                                                        │
│                                                                 │
│   ~/.khlone/                    # global khlone state          │
│   ├── config.json               # khlone global config         │
│   └── zones/                    # zone state cache             │
│                                                                 │
│   {worktree}/.khlone/           # per-worktree state           │
│   └── .bind.worksite/           # worksite bind (auto on init) │
│       ├── zone.yml              # zone config snapshot         │
│       ├── crew.yml              # active clones                │
│       └── task.yml              # tasks + artifacts (summary, complete) │
│                                                                 │
│   {worktree}/.khlone/clones/    # clone state and checkpoints  │
│   ├── mechanic.1/                                              │
│   │   ├── state.json                                           │
│   │   ├── checkpoint.json                                      │
│   │   └── transcript.jsonl                                     │
│   └── researcher.1/                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### layer responsibilities

| layer | responsibility |
|-------|----------------|
| **shell-native** | ux — ask/act, --who, --when, --watch, envvar |
| **replbuffer** | mechanics — queue, persist, checkpoint, recover, transcript, artifacts |
| **repl adapter** | abstraction — spawn, send, read, checkpoint, restart per repl |

### headless mode

repls run without their tui — just the ai process:

```sh
# claude-code headless
claude --headless --output-format jsonl

# opencode headless
opencode --no-tui --json
```

benefits:
- lower resource draw (no electron/terminal overhead)
- faster startup (skip ui initialization)
- stable output (json stream instead of ansi chaos)
- scriptable (easy to parse and filter)

---

## open questions

1. **checkpoint granularity**: how often to checkpoint? per tool call? per file write?
   - tradeoff: more checkpoints = better recovery, but more overhead

2. **headless mode availability**: which repls support headless?
   - claude-code: unclear, may need `--pipe` mode or hidden window
   - opencode: likely supports it
   - fallback: run in hidden terminal, capture pty output

3. **output filter design**: what to show in watch mode?
   - option a: just progress % and current file
   - option b: progress + recent tool calls + errors
   - option c: configurable verbosity levels

4. **talk semantics**: what happens to queue when in talk mode?
   - option a: queue pauses, you drive manually
   - option b: queue continues, you observe
   - option c: configurable per-talk

5. **repl adapter interface**: how to abstract different repls?
   - need: spawn, send task, read output, checkpoint, restart
   - each repl (claude-code, opencode, aider) gets an adapter

---

## what ships in v0.0

| capability | status |
|------------|--------|
| `khlone init` | read `khlone.worksite.yml`, set zone for worktree |
| implicit init | first `ask/act` triggers init automatically |
| worksite bind | `.khlone/.bind.worksite/` for multi-terminal awareness |
| `khlone ask/act` | queue task, return to shell |
| `--who clone` | target specific clone (e.g., `--who mechanic.1`) |
| `--who role++` | spawn new clone inline (e.g., `--who researcher++`) |
| `--when enqueue/disrupt` | later vs now |
| `--watch` | queue then stream output |
| `khlone status` | snapshot of zone + clones |
| `khlone watch` | live progress |
| `khlone talk` / `--talk` | interactive mode |
| `--zone ADDR` | cross-zone dispatch (`org/repo@branch`) |
| `--await` | block + emit output to stdout (shell pipe) |
| `khlone crew` | list clones in zone |
| `khlone worksite` | list all zones in the worksite |
| `khlone log` | transcript review |
| `$KHLONE_SESSION` | session resume |
| task artifacts | deterministic summary, complete, tokens on task end |
| onStop hooks | configurable prompts to capture artifacts on task end |
| queue persistence | survives shell exit |
| crash recovery | auto-restart, resume |
| headless execution | low resource |
| transcript capture | token account |

v0.0 ships the local foundation. v0.1 adds remote zones — same ux, different transport.

---

## summary

**replbuffer + shell-native** solves the daily pain:

- brain repls lag → **instant input** (0ms, local buffer)
- brain repls trap your shell → **ask/act then return**
- brain repls crash → **auto-recovery** (queue persists, checkpoint resumes)
- brain repls hog resources → **headless mode** (no ui overhead)
- brain repls spam output → **watch mode** (filtered progress)
- need raw access → **talk mode** (drop in, drop out)

your shell stays yours. the repl works in the background. you ask or act, then return.

```sh
$ khlone act "implement auth"
✓ enqueued to mechanic.1 (zone: ~/code/myproject)
$ _                              # that's it. shell is yours.
```
