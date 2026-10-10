# Origin of the third-party skills

Skills copied (vendored) from the upstream repositories. To update, clone the repo at the desired commit and replace the corresponding folder — do not edit the files by hand, so they do not drift from upstream.

| Skill(s) | Repository | Commit | License |
| --- | --- | --- | --- |
| `impeccable` (+ `.claude/agents/impeccable-*.md`) | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8` | Apache-2.0 |
| `ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, `ponytail-review` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | `e3ba2aa6f1e6f0bc4d69eb09c9f0d0a93af56156` | MIT |
| `api-and-interface-design` … `using-agent-skills` (25 skills) + `.claude/references/*.md` + `.claude/agents/{code-reviewer,security-auditor,test-engineer,web-performance-auditor}.md` | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | `bcab6a1b8503100e8618c3b4e32cc78de43de769` | MIT |
| `graphify` (SKILL.md = `graphify/skill.md`, `references/` = `graphify/skills/claude/references`) | [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) | `4000de15466588ec3ee32f9e10a587ca97d3b8a5` | Apache-2.0 |
| `frontend-design` ([agenticskills.io](https://agenticskills.io/skills/frontend-design) points to Anthropic's repo) | [anthropics/skills](https://github.com/anthropics/skills) | `33375500bcea98d610eb30ce10ac4e59b89c390d` | see `frontend-design/LICENSE.txt` |

## External dependencies

- **graphify** needs the Python CLI `graphifyy` (pinned version `0.9.68`): `pip install --user graphifyy==0.9.68` (or `uv tool install graphifyy==0.9.68`). Output in `graphify-out/` (ignored by git).
- **impeccable** ships its own scripts in `impeccable/scripts/`. The `settings.json` hooks from the upstream repository were **not** installed (they would run on every Edit/Write) — enable them only if you want the automatic detector.

## The project's own skills

`askedly-secure-endpoint` and `askedly-local-verification` were written in this repository (phase 13 of the earlier `PLAN.md`), from the findings of the audit (`docs/security.md`) and the validation pitfalls that were found.
