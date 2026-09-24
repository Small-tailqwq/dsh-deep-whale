# Host icon fixtures

`dsh-0.1.7-alpha.1-icons.json` contains complete SVG markup rendered with React
`renderToStaticMarkup` from the official DSH commit recorded in `hostCommit`.
`sources` lists the source files; `component` identifies the export or inline
variant, and `name` is the expected ORCA redraw.

The 200 variants cover the Regular and Medium primitive/permission icons,
composer send/stop, dock split/five drop zones, and browser sandbox states.
Inline variants use the host component bodies and constants, including their
full SVG children. They are not reconstructed from the matching fragments in
the skin. The usage meter is dynamic and has separate progress-update cases.

When adapting another host build, render its complete drawings again and
review the semantic mapping. Checking old fixtures against new matching code
does not detect a host artwork change. Keep removed host icons out of both
the matching table and the art table, after checking inline callers too.

The host SVG fixtures are MIT licensed by DeepSeek; see `DSH-LICENSE`.
