
SRC=src
BIN=bin
RESOURCES=resources
DEBIAN=debian/gamelauncher

all: gamelauncher

all.ccode: gamelauncher.ccode

clean: deb.clean
	$(RM) -rf $(BIN)/*
	$(RM) -rf c/*

install.user:
	mkdir -p ~/.local/share/applications/
	mkdir -p ~/.local/share/icons/
	sed "s|/usr/bin/|$(CURDIR)/bin/|g" "$(RESOURCES)/gamelauncher.desktop" > ~/.local/share/applications/gamelauncher.desktop
	cp "$(RESOURCES)/gamelauncher.svg" ~/.local/share/icons/

uninstall.user:
	$(RM) -f ~/.local/share/applications/gamelauncher.desktop
	$(RM) -f ~/.local/share/icons/gamelauncher.svg

include components.mk
include dependencies.mk
include debianized.mk
