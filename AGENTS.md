<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- ERA data lives only in `src/lib/era/store.ts` (localStorage `era_*` keys); components call its functions, never localStorage directly — so it can be swapped for a real backend later.
- Auth guards are client-side (`Protected` in `src/components/era/AppShell.tsx`) and redirect via `useEffect` navigate, never `<Navigate>` during render (it looped).
