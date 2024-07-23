set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

# Default Recipe; Runs hello
default: hello

# List all recipes
@help:
          just --list --justfile={{ justfile() }}

# Print hello in Powershell
[windows]
hello:
                    Write-Host "Hello, world!"

# Print hello in sh
[unix]
hello:
            echo "Hello, world!"
