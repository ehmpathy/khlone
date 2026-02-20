# rhachet: core domain concepts

> extracted from github.com/ehmpathy/rhachet

---

## atomic concepts

| concept | definition |
|---------|------------|
| **brain** | llm instance (ai provider) — the raw reason capability (claude, codex, etc) |
| **role** | foundational unit with skills + briefs — defines identity, capabilities, and context |
| **actor** | brain + role — an agent ready to perform work |
| **skill** | executable operation — shell command or deterministic workflow |
| **brief** | contextual documentation — guides decisions within a role |

---

## the key insight: actor = brain + role

```
brain (claude) + role (mechanic) = actor (mechanic.1)
         │              │                   │
         │              │                   └── ready to work
         │              └── skills + briefs + identity
         └── raw reason capability
```

a brain is just an ai provider. it becomes useful when enrolled with a role.

a role defines:
- what skills the actor can execute
- what briefs guide its decisions
- what identity it operates under

an actor is the combination — a brain that knows its role and can do work.

---

## three thought routes

actors operate through distinct modes:

| mode | method | description |
|------|--------|-------------|
| **solid** | `.run()` | shell skill execution, no ai reason |
| **rigid** | `.act()` | skill execution with deterministic harness; brain augments decisions |
| **fluid** | `.ask()` | conversational reason; brain decides the path |

---

## role organization

roles live in `.agent/` directories:

```
.agent/
├── repo=.this/           # roles for this repo
│   ├── role=any/         # applies to all actors
│   ├── role=mechanic/    # mechanic-specific
│   └── role=foreman/     # foreman-specific
└── repo=ehmpathy/        # roles from external repos
    └── role=reviewer/
```

---

## implications for khlone

in khlone, we use **clone** as the term for **actor**:

| rhachet term | khlone term | definition |
|--------------|-------------|------------|
| brain | brain | ai provider (claude, codex, etc) |
| role | role | identity: `{type}.{n}` (mechanic.1, foreman.1) |
| actor | clone | brain enrolled with a role via rhachet |

so:
- **clone = actor = brain + role**
- foreman is a role type, just like mechanic, architect, reviewer
- the role determines skills/briefs; the brain provides reason
- enrollment happens via rhachet
- **clone.0** = the first clone spawned on `khlone up`; configurable via `khlone.crew.yml`

---

## the complete picture

```
                rhachet
                   │
         ┌────────┴────────┐
         │                 │
       brain             role
    (ai provider)   (skills + briefs)
         │                 │
         └────────┬────────┘
                  │
                actor
              (= clone)
                  │
    ┌─────────────┼─────────────┐
    │             │             │
foreman.1    mechanic.1    architect.1
```

rhachet manages the enrollment of brains into roles. the result: actors (clones) ready to work.
