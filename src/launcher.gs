[indent=4]

namespace GameLauncher

    class Launcher: Object
        def static is_valid(info: FileInfo, file: File): bool
            if info.get_file_type() != FileType.DIRECTORY
                var file_path = file.get_path()
                if file_path.down().has_suffix(".desktop")
                    return true
            return false
    
        construct(file: File) raises Error
            _file = file
            _path = _file.get_path()
            _key_file = new KeyFile()
            _key_file.load_from_file(_path, KeyFileFlags.KEEP_COMMENTS)
            
        prop readonly file: File
        prop readonly path: string
            
        prop readonly name: string?
            owned get
                try
                    return _key_file.get_string("Desktop Entry", "Name")
                except e: KeyFileError
                    return null
        
        prop readonly icon: string?
            owned get
                try
                    return _key_file.get_string("Desktop Entry", "Icon")
                except e: KeyFileError
                    return null

        prop exec: string?
            owned get
                try
                    return _key_file.get_string("Desktop Entry", "Exec")
                except e: KeyFileError
                    return null
            set
                _key_file.set_string("Desktop Entry", "Exec", value)
        
        prop gaming_desktop_enabled: bool
            get
                var exec = self.exec
                return (exec is not null) and (exec.has_prefix("xinit ") or exec.has_prefix("/usr/bin/xinit ")) and exec.has_suffix(" -- :1")
            set
                if gaming_desktop_enabled != value
                    var exec = self.exec
                    if exec is not null
                        if value
                            exec = "/usr/bin/xinit " + exec + " -- :1"
                        else
                            if exec.has_prefix("xinit ")
                                exec = exec.substring(6)
                            else if exec.has_prefix("/usr/bin/xinit ")
                                exec = exec.substring(15)
                            if exec.has_suffix(" -- :1")
                                exec = exec.slice(0, exec.length - 6)
                        self.exec = exec

        def save() raises Error
            if is_admin()
                var data = _key_file.to_data()
                var dir = _file.get_parent()
                if not dir.query_exists() or (dir.query_info(FileAttribute.STANDARD_TYPE, FileQueryInfoFlags.NONE).get_file_type() != FileType.DIRECTORY)
                    dir.make_directory_with_parents()
                if not FileUtils.set_data(_path, data.data)
                    raise new IOError.FAILED("Could not save to file: %s".printf(_path))
            else
                var exec = self.exec
                if exec is not null
                    revoke_administrative_privileges()
                    change_launcher_exec(_path, exec)
                    revoke_administrative_privileges()
        
        _key_file: KeyFile
