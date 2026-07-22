{
  description = "dnd-engagement-party dev environment";

  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};

      db = pkgs.writeShellScriptBin "db" ''
        set -euo pipefail
        cd "$(git rev-parse --show-toplevel)"
        docker compose -f docker-compose.local.yml up -d
        echo "Waiting for Postgres..."
        until docker exec "$(docker compose -f docker-compose.local.yml ps -q db)" pg_isready -U postgres -d dnd_engagement_party >/dev/null 2>&1; do
          sleep 1
        done
        echo "Postgres is ready on localhost:5432"
      '';

      run = pkgs.writeShellScriptBin "run" ''
        set -euo pipefail
        cd "$(git rev-parse --show-toplevel)"
        if [ ! -f .env ]; then
          echo ".env not found - run: cp .env.example .env, then fill it in" >&2
          exit 1
        fi
        db
        pnpm install
        pnpm dev
      '';

      run-admin = pkgs.writeShellScriptBin "run-admin" ''
        set -euo pipefail
        cd "$(git rev-parse --show-toplevel)/admin"
        if [ ! -f .env ]; then
          echo "admin/.env not found - run: cp admin/.env.example admin/.env, then fill it in" >&2
          exit 1
        fi
        set -a
        source .env
        set +a
        go run .
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
        buildInputs = [ pkgs.nodejs_22 pkgs.pnpm pkgs.go db run run-admin check ];

        shellHook = ''
          echo ""
          echo "dnd-engagement-party dev shell - available commands:"
          echo "  db          start the local Postgres (docker compose)"
          echo "  run         run the main app (pnpm dev)"
          echo "  run-admin   run the admin app (go run)"
          echo "  check       run every check both apps run in CI"
          echo ""
        '';
      };
    };
}
