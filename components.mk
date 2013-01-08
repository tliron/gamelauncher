#
# Expected variables for this template: SRC, BIN
#

find-sources=$(shell find "$(SRC)/$1" \( -name '*.gs' -o -name '*.vala' \))

#
# Vala packages and their Ubuntu dependencies:
#
# Gee:          apt-get install libgee-dev            valac --pkg=gee-1.0
# Soup:         apt-get install libsoup2.4-dev        valac --pkg=libsoup-2.4
# Json:         apt-get install libjson-glib-dev      valac --pkg=json-glib-1.0
# Sqlite:       apt-get install libsqlite3-dev        valac --pkg=sqlite3
# Posix:                                              valac --pkg=posix --Xcc=-D_GNU_SOURCE
# Gtk:          apt-get install libgtk-3-dev          valac --pkg=gtk+-3.0
# Daemon:       apt-get install libdaemon-dev         valac --pkg=libdaemon
# Gst:          apt-get install libgstreamer1.0-dev   valac --pkg=gstreamer-1.0
# Unity:        apt-get install libunity-dev          valac --pkg=unity
# Indicate:     apt-get install libindicate-dev       valac --pkg=Indicate-0.7 --Xcc=-I/usr/include/libindicate-0.7 --Xcc=-lindicate
# TagLib:       apt-get install libtagc0-dev          valac --pkg=taglib_c
# AppIndicator: apt-get install libappindicator-dev   valac --pkg=appindicator-0.1
# Avahi:        apt-get install libavahi-gobject-dev  valac --pkg=avahi-gobject
#
# gstreamer1.0-pulseaudio, gstreamer1.0-features-base
#

#
# valac notes:
#
# 1) We are using --target-glib=2.32 in order to support GLib.Mutex as struct.
#
# 2) We are forwarding the defined C compiler flags to valac.
# See: http://wiki.debian.org/Hardening#Notes_for_packages_using_Vala
#

VALAC=valac \
	--basedir=$(SRC) \
	--vapidir=$(SRC) \
	--directory=$(BIN) \
	--thread \
	--debug \
	--target-glib=2.32 \
	--Xcc=-w \
	$(foreach w,$(CPPFLAGS) $(CFLAGS) $(LDFLAGS),-X $(w))

VALAC.C=valac \
	--ccode \
	--basedir=$(SRC) \
	--vapidir=$(SRC) \
	--thread \
	--debug \
	--target-glib=2.32 \
	--Xcc=-w \
	$(foreach w,$(CPPFLAGS) $(CFLAGS) $(LDFLAGS),-X $(w))

#
# gamelauncher
#

GAME_LAUNCHER_SOURCES=\
	$(call find-sources)

GAME_LAUNCHER_PACKAGES=\
	--pkg=gee-1.0 \
	--pkg=posix --Xcc=-D_GNU_SOURCE \
	--pkg=gtk+-3.0 \
	--pkg=unity

gamelauncher:
	$(VALAC) --output=gamelauncher $(GAME_LAUNCHER_SOURCES) $(GAME_LAUNCHER_PACKAGES)

gamelauncher.ccode:
	$(VALAC.C) --directory=c/gamelauncher $(GAME_LAUNCHER_SOURCES) $(GAME_LAUNCHER_PACKAGES)
