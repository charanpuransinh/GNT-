/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies — modules aapas mein ek dusre ko import karte hain',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      comment: 'Broken imports — resolve nahi hote',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Orphan files — kisi se import nahi hote (dead code)',
      from: { orphan: true },
      to: {},
    },
  ],
  options: {
    doNotFollow: {
      path: ['node_modules', 'dist'],
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: '/root/gnt-project/GNT_GITHUB_REPOSITORY/tsconfig.backend.json',
    },
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
};
