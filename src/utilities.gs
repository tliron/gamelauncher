[indent=4]

uses
    Gtk

namespace GameLauncher

    /*
     * Represents a text file divided by lines.
     */
    class LinesFile
        construct(name: string) raises Error
            _name = name
            var file = File.new_for_path(_name)
            if file.query_exists()
                var stream = FileStream.open(_name, "r")
                if stream is null
                    raise new IOError.FAILED("Could not open \"%s\" for reading".printf(_name))
                var line = stream.read_line()
                while line is not null  
                    _lines.add(line)
                    line = stream.read_line()
                
        prop readonly name: string
        prop readonly lines: list of string = new list of string
            
        def save() raises Error
            make_parents()
            var stream = FileStream.open(_name, "w")
            if stream is null
                raise new IOError.FAILED("Could not open \"%s\" for writing".printf(_name))
            for line in _lines
                stream.printf("%s\n", line)
        
        def backup() raises Error
            var file = File.new_for_path(_name)
            if not file.query_exists()
                return
            var backup = File.new_for_path(_name + ".gamelauncher")
            if backup.query_exists()
                return
            file.copy(backup, FileCopyFlags.BACKUP)

        def make_parents() raises Error
            var file = File.new_for_path(_name).get_parent()
            if not file.query_exists() or (file.query_info(FileAttribute.STANDARD_TYPE, FileQueryInfoFlags.NONE).get_file_type() != FileType.DIRECTORY)
                file.make_directory_with_parents()

    /*
     * Loads icons from cache or from the default IconTheme.
     */
    def fetch_icon(name: string?): Gdk.Pixbuf?
        if name is not null
            if _icons is null
                _icons = new dict of string, Gdk.Pixbuf
             if _icons.has_key(name)
                return _icons[name]
            try
                var icon = IconTheme.get_default().load_icon(name, ICON_SIZE, IconLookupFlags.FORCE_SIZE)
                if icon is not null
                    _icons[name] = icon
                    return icon
            except e: Error
                pass
        if _default_icon is null
            try
                _default_icon = IconTheme.get_default().load_icon(Stock.EXECUTE, ICON_SIZE, IconLookupFlags.FORCE_SIZE)
            except e: Error
                pass
        return _default_icon

    def is_admin(): bool
        return Environment.get_user_name() == "root"    
    
    def revoke_administrative_privileges()
        try
            Process.spawn_command_line_sync("/usr/bin/sudo -k")
        except e: SpawnError
            pass

    def set_xwrapper_allowed_users(value: string) raises SpawnError
        Process.spawn_command_line_sync("/usr/bin/gksudo --message=\"Please enter your administrative password in order grant permission to create the gaming desktop (will affect all users).\" -- /bin/sed --in-place=.gamelauncher \"s|^allowed_users=[A-Za-z]*|allowed_users=%s|\" /etc/X11/Xwrapper.config".printf(value))

    def change_launcher_exec(path: string, value: string) raises SpawnError
        Process.spawn_command_line_sync("/usr/bin/gksudo --message=\"Please enter your administrative password in order to modify this game launcher.\" -- /bin/sed --in-place=.gamelauncher \"s|^Exec=.*|Exec=%s|\" \"%s\"".printf(value, path))
    
    def add_to_audio_group(username: string) raises SpawnError
        Process.spawn_command_line_sync("/usr/bin/gksudo --message=\"Please enter your administrative password in order grant permission to listen to audio on the gaming desktop (will only affect your user).\" -- /usr/sbin/usermod -a -G audio %s".printf(username))

    def groups(): array of string raises SpawnError
        groups: string
        Process.spawn_command_line_sync("/usr/bin/groups", out groups)
        return groups.split(" ")

    _icons: dict of string, Gdk.Pixbuf
    _default_icon: Gdk.Pixbuf

    const private ICON_SIZE: int = 16
