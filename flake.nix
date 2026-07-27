{
  description = "dnd-engagement-party dev environment";

  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};
      postgresql = pkgs.postgresql_17;

      # Data directory for the Nix-managed local Postgres, relative to the
      # repo root. Gitignored - this is a real (if throwaway) data
      # directory, not config.
      pgDataDir = ".data/postgres";

      # Credentials match .env.example's POSTGRES_PRISMA_URL so the app
      # connects without further setup.
      pgUser = "postgres";
      pgPassword = "password";
      pgDatabase = "dnd_engagement_party";
      pgPort = "5432";

      # Shared by db/db-fg/db-stop: resolves pgdata + a short, repo-keyed
      # socket dir, and exports the connection env every client below uses.
      dbEnvAndPaths = ''
        repo_root="$(git rev-parse --show-toplevel)"
        pgdata="$repo_root/${pgDataDir}"
        # Unix socket paths are capped at ~107 bytes by the kernel, and repo
        # checkouts (especially worktrees under .claude/worktrees/...) can
        # easily exceed that - so the socket lives in a short, repo-keyed
        # /tmp path instead of alongside pgdata. Every client below connects
        # over TCP (-h localhost) anyway; this dir only exists because
        # postgres itself requires *a* unix socket directory to start.
        repo_key="$(echo -n "$repo_root" | ${pkgs.coreutils}/bin/md5sum | cut -c1-12)"
        sockdir="''${TMPDIR:-/tmp}/dnd-pg-$repo_key"
        export PGHOST=localhost
        export PGPORT=${pgPort}
        export PGUSER=${pgUser}
        export PGPASSWORD=${pgPassword}
        export PGDATABASE=${pgDatabase}
      '';

      # initdb the cluster on first use. Idempotent - guarded by PG_VERSION.
      dbEnsureInitialized = ''
        if [ ! -s "$pgdata/PG_VERSION" ]; then
          echo "Initializing Postgres data directory at $pgdata..."
          mkdir -p "$pgdata"
          pwfile="$(mktemp)"
          trap 'rm -f "$pwfile"' EXIT
          printf '%s' "$PGPASSWORD" > "$pwfile"
          ${postgresql}/bin/initdb -D "$pgdata" -U "$PGUSER" --pwfile="$pwfile" --auth=scram-sha-256 >/dev/null
        fi

        mkdir -p "$sockdir"
      '';

      # Waits for a (already-starting) server to accept connections, then
      # creates the app database if it's missing. Idempotent.
      dbEnsureDatabase = ''
        echo "Waiting for Postgres..."
        until ${postgresql}/bin/pg_isready -h "$PGHOST" -p "$PGPORT" >/dev/null 2>&1; do
          sleep 1
        done

        if ! ${postgresql}/bin/psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -tAc \
            "SELECT 1 FROM pg_database WHERE datname = '$PGDATABASE'" | grep -q 1; then
          echo "Creating database $PGDATABASE..."
          ${postgresql}/bin/createdb -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" "$PGDATABASE"
        fi
      '';

      db = pkgs.writeShellScriptBin "db" ''
        set -euo pipefail
        ${dbEnvAndPaths}
        ${dbEnsureInitialized}

        if ! ${postgresql}/bin/pg_ctl -D "$pgdata" status >/dev/null 2>&1; then
          echo "Starting Postgres..."
          ${postgresql}/bin/pg_ctl -D "$pgdata" -l "$pgdata/server.log" -o "-p $PGPORT -k $sockdir" start >/dev/null
        fi

        ${dbEnsureDatabase}

        echo "Postgres is ready on localhost:$PGPORT"
      '';

      db-fg = pkgs.writeShellScriptBin "db-fg" ''
        set -euo pipefail
        ${dbEnvAndPaths}
        ${dbEnsureInitialized}

        if ${postgresql}/bin/pg_ctl -D "$pgdata" status >/dev/null 2>&1; then
          echo "Stopping the backgrounded Postgres (started via 'db') to take over in the foreground..."
          ${postgresql}/bin/pg_ctl -D "$pgdata" stop -m fast
        fi

        # The database-exists check needs a running server, so start one
        # briefly in the background just for that, then hand off below.
        ${postgresql}/bin/pg_ctl -D "$pgdata" -l "$pgdata/server.log" -o "-p $PGPORT -k $sockdir" start >/dev/null
        ${dbEnsureDatabase}
        ${postgresql}/bin/pg_ctl -D "$pgdata" stop -m fast >/dev/null

        echo "Starting Postgres in the foreground on localhost:$PGPORT (Ctrl+C to stop)..."
        exec ${postgresql}/bin/postgres -D "$pgdata" -p "$PGPORT" -k "$sockdir"
      '';

      db-stop = pkgs.writeShellScriptBin "db-stop" ''
        set -euo pipefail
        repo_root="$(git rev-parse --show-toplevel)"
        pgdata="$repo_root/${pgDataDir}"

        if ${postgresql}/bin/pg_ctl -D "$pgdata" status >/dev/null 2>&1; then
          ${postgresql}/bin/pg_ctl -D "$pgdata" stop -m fast
        else
          echo "Postgres is not running"
        fi
      '';

      migrate = pkgs.writeShellScriptBin "migrate" ''
        set -euo pipefail
        cd "$(git rev-parse --show-toplevel)"
        db
        # Prisma CLI (via prisma.config.ts's `import "dotenv/config"`) only
        # auto-loads a file literally named .env, not .env.development.local -
        # so this is set explicitly rather than relying on whichever env
        # file happens to be present. Same values db/db-fg provision.
        export POSTGRES_PRISMA_URL="postgresql://${pgUser}:${pgPassword}@localhost:${pgPort}/${pgDatabase}"
        pnpm install
        pnpm db:migrate
      '';

      run = pkgs.writeShellScriptBin "run" ''
        set -euo pipefail
        cd "$(git rev-parse --show-toplevel)"
        if [ ! -f .env.development.local ]; then
          echo ".env.development.local not found - run: cp .env.example .env.development.local, then fill it in" >&2
          exit 1
        fi
        db
        pnpm install
        pnpm dev
      '';

      run-admin = pkgs.writeShellScriptBin "run-admin" ''
        set -euo pipefail
        cd "$(git rev-parse --show-toplevel)/admin"
        if [ ! -f .env.development.local ]; then
          echo "admin/.env.development.local not found - run: cp admin/.env.example admin/.env.development.local, then fill it in" >&2
          exit 1
        fi
        set -a
        source .env.development.local
        set +a
        go run .
      '';

      run-admin-prod = pkgs.writeShellScriptBin "run-admin-prod" ''
        set -euo pipefail
        cd "$(git rev-parse --show-toplevel)/admin"
        if [ ! -f .env.production.local ]; then
          echo "admin/.env.production.local not found - run: cp admin/.env.example admin/.env.production.local, then fill it in" >&2
          exit 1
        fi
        set -a
        source .env.production.local
        set +a
        go run .
      '';

      format = pkgs.writeShellScriptBin "format" ''
        set -euo pipefail
        repo_root="$(git rev-parse --show-toplevel)"

        echo "==> Main app"
        cd "$repo_root"
        pnpm format

        echo "==> Admin app"
        cd "$repo_root/admin"
        gofmt -w .

        echo "All apps formatted."
      '';

      check = pkgs.writeShellScriptBin "check" ''
        set -euo pipefail
        repo_root="$(git rev-parse --show-toplevel)"

        echo "==> Main app"
        cd "$repo_root"
        pnpm install --frozen-lockfile
        pnpm format:check
        pnpm lint
        pnpm test
        pnpm prisma generate
        POSTGRES_PRISMA_URL="''${POSTGRES_PRISMA_URL:-postgresql://user:pass@localhost:5432/db}" pnpm build

        echo "==> Admin app"
        cd "$repo_root/admin"
        test -z "$(gofmt -l .)"
        go vet ./...
        go build ./...
        go test ./...

        echo "All checks passed."
      '';
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = [ pkgs.nodejs_22 pkgs.pnpm pkgs.go postgresql db db-fg db-stop migrate run run-admin run-admin-prod format check ];

        shellHook = ''
          echo ""
          echo "dnd-engagement-party dev shell - available commands:"
          echo "  db              start the local Postgres in the background (Nix-managed, data in .data/postgres)"
          echo "  db-fg           start the local Postgres in the foreground (Ctrl+C to stop, no db-stop needed)"
          echo "  db-stop         stop the backgrounded local Postgres"
          echo "  migrate         start Postgres and apply pending Prisma migrations"
          echo "  run             run the main app (pnpm dev)"
          echo "  run-admin       run the admin app (go run)"
          echo "  run-admin-prod  run the prod admin app (go run)"
          echo "  format          format both apps (biome + gofmt)"
          echo "  check           run every check both apps run in CI"
          echo ""
        '';
      };
    };
}
