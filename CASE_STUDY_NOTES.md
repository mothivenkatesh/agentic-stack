# One UI Research Notes

These notes translate two complex B2B product-design case studies into One UI rules for generated interfaces.

## ScaleXP: Automated Time-Series Reports

Source: https://suwardhan.com/scalexp

Relevant lessons:

- Finance and executive reporting UIs need flexible columns because companies compare actuals, targets, forecasts, countries, entities, and reporting standards differently.
- Metric definitions should be reusable library objects, not one-off chart calculations.
- Complex metrics need explicit order of operations. Treat them as trees or dependency graphs instead of flat rows.
- Dense edit modes can use horizontal, scan-first layouts when users compare many columns or periods.
- A 4px base grid is a good default for dense operational UI.

One UI implications:

- Give metrics, portfolios, rules, prompts, and saved searches first-class definition screens.
- Show calculation structure, dependencies, source, owner, and last updated metadata.
- Use tables and compact panels for repeat work; use cards only for bounded modules or repeated entities.
- Let generated UI show actual vs target/forecast and entity breakdowns without inventing new component geometry.

## Clarisights: Custom Dimensions

Source: https://suwardhan.com/clarisights

Relevant lessons:

- Analytics systems become hard to use when critical details are hidden behind too many clicks.
- Redundant filters and scattered rule structure create maintenance debt.
- Edits to shared definitions need dependency visibility before publishing.
- Listing pages should expose values, sources/channels, filters/rules, and dependencies with minimal navigation.
- Error copy, automatic level assignment, and color-coded rules reduce cognitive load.

One UI implications:

- Prefer `Definition -> Value -> Rule -> Filter/Source` information architecture for reusable segmentation systems.
- Use dependency modals or drawers before global edits, deletes, publishes, or regenerations.
- Surface dependent dashboards, reports, generated UI, owners, and last-used timestamps.
- Use tokenized semantic colors for rule status and validation, not local color palettes.

## Gold-Standard LLM Behavior

When generating UI for complex systems, an LLM should:

- Ask what reusable definition is being created or edited.
- Identify downstream dependencies before proposing a destructive or global action.
- Use classes and tokens instead of inline CSS.
- Include empty/loading/error/success/warning states.
- Show evidence, recency, confidence, source, and assumption metadata for AI or analytics output.
- Prefer dense, scan-first product layouts over decorative marketing layouts.

## Leap: Web3 Wallet Mobile App

Source: https://suwardhan.com/leap

Relevant lessons:

- Mobile apps need their own information architecture, not a compressed extension or desktop view.
- High-risk actions need visible trust and security explanation before the user commits.
- Power users still need compact, repeatable paths for assets, transfers, staking, governance, and activity.
- A component library is essential because the same mobile patterns repeat across portfolio, send, connect, stake, proposal, and asset-detail screens.

One UI implications:

- Use sticky mobile context bars, dark bottom navigation, safe-area-aware actions, and 44px tap targets.
- Keep active entity/account/workspace context visible near the top of the flow.
- Put trust/security/saved-state explanation beside sensitive generation, connection, publishing, or deploy actions.
- Prefer compact cards and bottom sheets to full desktop panels on mobile.

## Smartbeings: Conversation Flow Builder

Source: https://suwardhan.com/smartbeings

Relevant lessons:

- Complex flow builders work best when assets, flow canvas, and configuration/testing stay visible in one place.
- Domain assets such as nodes, intents, entities, and code blocks should be one click away while building.
- Node types need visual distinction; branch conditions and node errors must be visible at the point of work.
- If no node is selected, the configuration area can become a live testing panel.
- Clear empty states and guided help reduce onboarding friction.

One UI implications:

- Use a three-pane desktop builder: assets rail, central journey canvas, configuration/testing panel.
- Use a progressive mobile builder: flow first, then selected node details and testing.
- Show node-level errors on cards and flow-level errors near deploy/recommend/publish.
- Let users test or preview without leaving the builder context.
