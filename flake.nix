{
  description = "dnd-engagement-party dev environment";

  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};

      claudeSettingsLocal = {
        enabledPlugins = {
          "vercel@claude-plugins-official" = true;
        };
        permissions = {
          allow = [
            "Bash(pnpm dev:*)"
            "Bash(pnpm approve-builds:*)"
            "Bash(pnpm install:*)"
            "Bash(pnpm rebuild:*)"
            "Bash(kill %1)"
            "Bash(pnpm add *)"
            "Bash(pnpm --version)"
            "Bash(find /home/david -name \"pnpm-build-approved.json\" 2>/dev/null | head -5)"
            "Read(//home/david/**)"
            "Bash(pnpm prisma *)"
            "Bash(DATABASE_URL=\"file:./dev.db\" pnpm prisma migrate dev --name init)"
            "Bash(mkdir -p /home/david/Projects/dnd-engagement-party/src/app/api/invitations/\\\\[code\\\\]/response)"
            "Bash(mkdir -p /home/david/Projects/dnd-engagement-party/src/app/invite/\\\\[code\\\\])"
            "Bash(pnpm build *)"
            "Bash(docker compose *)"
            "Bash(sudo ss -tlnp)"
            "Bash(systemctl --user list-units --type=service --state=running)"
            "Bash(systemctl list-units *)"
            "Bash(systemctl status *)"
            "Bash(docker stop *)"
            "Bash(pnpm tsx *)"
            "Bash(vercel)"
            "Bash(vercel env *)"
            "Bash(vercel --force)"
          ];
          additionalDirectories = [
            "/home/david/Projects/dnd-engagement-party/src/app/api/invitations/[code]"
            "/home/david/Projects/dnd-engagement-party/src/app/invite"
          ];
        };
      };

      claudeSettingsLocalJson = pkgs.writeText "claude-settings-local.json"
        (builtins.toJSON claudeSettingsLocal);
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        shellHook = ''
          mkdir -p .claude
          cp -f ${claudeSettingsLocalJson} .claude/settings.local.json
          chmod u+w .claude/settings.local.json
        '';
      };
    };
}
