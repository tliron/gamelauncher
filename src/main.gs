[indent=4]

uses
    Gtk

namespace GameLauncher

    class MainWindow: ApplicationWindow
        construct(application: Application) raises Error
            Object(application: application)

            _xwrapper = new Xwrapper()
            _saved_favorites = new SavedFavorites()
            
            title = "Game Launcher"
            startup_id = "gamelauncher"
            
            set_position(WindowPosition.CENTER)
            set_default_size(900, 600)
            border_width = 10
            
            var status_box = new Box(Orientation.HORIZONTAL, 10)
            _status = new Label("")
            _status.use_markup = true
            _status.xalign = 0
            _enable = new Button.with_mnemonic("_Enable the gaming desktop")
            _enable.no_show_all = true
            _enable.clicked.connect(on_enable)
            var button_box = new ButtonBox(Orientation.VERTICAL)
            button_box.pack_start(_enable, true, false)
            status_box.pack_start(button_box, false)
            status_box.pack_start(_status)

            _favorite_applications = new ApplicationsView(self, "Favorites")
            _all_applications = new ApplicationsView(self, "All Applications")
            
            // Note: Newer GNOME desktops tend to disable image visibility by default,
            // but we will explicitly show the images because we think it's easier to
            // understand at a glance!

            button_box = new ButtonBox(Orientation.VERTICAL)
            var add_favorite = new Button.from_stock(Stock.ADD)
            add_favorite.image.show()
            add_favorite.clicked.connect(on_add_favorite)
            var remove_favorite = new Button.from_stock(Stock.REMOVE)
            remove_favorite.image.show()
            remove_favorite.clicked.connect(on_remove_favorite)
            button_box.pack_start(add_favorite)
            button_box.pack_start(remove_favorite)
            var middle_box = new Box(Orientation.VERTICAL, 0)
            middle_box.pack_start(button_box, true, false)

            var applications_box = new Box(Orientation.HORIZONTAL, 10)
            applications_box.pack_start(_favorite_applications)
            applications_box.pack_start(middle_box, false)
            applications_box.pack_start(_all_applications)
            
            var main_box = new Box(Orientation.VERTICAL, 10)
            main_box.pack_start(status_box, false)
            main_box.pack_start(new Separator(Orientation.HORIZONTAL), false)
            main_box.pack_start(applications_box)
            add(main_box)

            delete_event.connect(on_delete)

            update()
        
        def on_error(e: Error, message: string)
            var dialog = new MessageDialog.with_markup(self, DialogFlags.MODAL, MessageType.ERROR, ButtonsType.CLOSE, "%s\n\n%s".printf(message, e.message))
            dialog.run()
            dialog.destroy()
        
        def update() raises Error
            _x = has_x_permission()
            _audio = has_audio_permission()
            _favorite_applications.sensitive = _all_applications.sensitive = _x and _audio
            
            if _x and _audio
                _status.label = "Double-click on an application in the lists below to launch it in the gaming desktop.\nUse <b>CTRL+ALT+F7</b> to switch back to this desktop, and <b>CTRL+ALT+F8</b> to switch to the gaming desktop.\n\nIf you enable the checkbox next to the application, then it will <i>always</i> launch in the gaming desktop, even if you don't use Game Launcher.\n\nNote that only one application at a time can run in the gaming desktop."
                _enable.hide()
            else if not _x and not _audio
                _status.label = "The gaming desktop is currently disabled!\nYou do not have the required permissions."
                _enable.show()
            else if not _x
                _status.label = "The gaming desktop is currently disabled!\nYou do not have permission to create it."
                _enable.show()
            else // if not _audio
                _status.label = "The gaming desktop is currently disabled!\nYou do not have permission to listen to audio on it."
                _enable.show()

            // All applications
            var system_applications = File.new_for_path("/usr/share/applications")
            var enumerator = system_applications.enumerate_children(FILE_ATTRIBUTES, FileQueryInfoFlags.NONE)
            var all_launchers = new list of Launcher
            while true
                var info = enumerator.next_file()
                if info is null
                    break
                
                var file = enumerator.get_container().resolve_relative_path(info.get_name())
                if Launcher.is_valid(info, file)
                    var launcher = new Launcher(file)
                    if launcher.name is not null
                        all_launchers.add(launcher)
            
            all_launchers.sort((CompareFunc) compare_launchers)
            _all_applications.update(all_launchers)

            // Favorites
            var favorite_launchers = new list of Launcher
            for var path in _saved_favorites.lines
                launcher: Launcher? = null
                for var l in all_launchers
                    if l.path == path
                        launcher = l
                        break
                if launcher is null
                    var file = File.new_for_path(path)
                    var info = file.query_info(FILE_ATTRIBUTES, FileQueryInfoFlags.NONE)
                    if Launcher.is_valid(info, file)
                        launcher = new Launcher(file)
                if (launcher is not null) and (launcher.name is not null)
                    favorite_launchers.add(launcher)

            favorite_launchers.sort((CompareFunc) compare_launchers)
            _favorite_applications.update(favorite_launchers)
        
        def private on_delete(e: Gdk.EventAny): bool
            application.quit()
            return true
            
        def private on_add_favorite()
            var launcher = _all_applications.get_selected_launcher()
            if launcher is not null
                _saved_favorites.lines.add(launcher.path)
                try
                    _saved_favorites.save()
                    update()
                except e: Error
                    on_error(e, "Could not update!")

        def private on_remove_favorite()
            var launcher = _favorite_applications.get_selected_launcher()
            if launcher is not null
                _saved_favorites.lines.remove(launcher.path)
                try
                    _saved_favorites.save()
                    update()
                except e: Error
                    on_error(e, "Could not update!")

        def private on_enable()
            if not _x
                try
                    _xwrapper.allowed_users = Xwrapper.AllowedUsers.ANYBODY
                    _xwrapper.save()
                except e: Error
                    on_error(e, "Could not modify X wrapper permissions!")

            if not _audio
                revoke_administrative_privileges()
                try
                    add_to_audio_group(Environment.get_user_name())
                except e: SpawnError
                    on_error(e, "Could not add you to the audio group!")
                revoke_administrative_privileges()

            try
                update()
            except e: Error
                on_error(e, "Could not update!")
        
        def private has_x_permission(): bool
            return _xwrapper.allowed_users == Xwrapper.AllowedUsers.ANYBODY
        
        def private has_audio_permission(): bool
            try
                for var group in groups()
                    if group == "audio"
                        return true
            except e: SpawnError
                stderr.printf("%s\n", e.message)
            return false
                
        _favorite_applications: ApplicationsView
        _all_applications: ApplicationsView
        _status: Label
        _enable: Button
        _xwrapper: Xwrapper
        _saved_favorites: SavedFavorites
        _x: bool
        _audio: bool

        const private FILE_ATTRIBUTES: string = FileAttribute.STANDARD_NAME + "," + FileAttribute.STANDARD_TYPE + "," + FileAttribute.STANDARD_IS_HIDDEN + "," + FileAttribute.ACCESS_CAN_READ

        def static compare_launchers(a: Launcher, b: Launcher): int
            return a.name.collate(b.name)
