[indent=4]

/*
/etc/X11/Xwrapper.config

       allowed_users
	      may  be set to one of the following values:
	      rootonly,console,anybody.  "rootonly" indicates that only
	      the root user may start the X server; "console" indicates
	      that root, or any user whose controlling TTY is a virtual
	      console, may start the X server; and "anybody" indicates
	      that any user may  start the X server.
*/

namespace GameLauncher

    class Xwrapper: LinesFile
        construct() raises Error
            super("/etc/X11/Xwrapper.config")
            
        prop allowed_users: AllowedUsers
            get
                for var line in lines
                    if line.has_prefix("allowed_users=")
                        var value = line.substring(14).strip()
                        
                        // Remove trailing comment
                        var comment_index = value.index_of_char('#')
                        if comment_index != -1
                            value = value.slice(0, comment_index).strip()

                        if value == "rootonly"
                            return AllowedUsers.ROOT_ONLY
                        else if value == "console"
                            return AllowedUsers.CONSOLE
                        else if value == "anybody"
                            return AllowedUsers.ANYBODY
                        else
                            break
                return AllowedUsers.UNKNOWN
            set
                var i = lines.list_iterator()
                while i.next()
                    var line = i.@get()
                    if line.has_prefix("allowed_users=")
                        // Trailing comment
                        comment: string? = null
                        var comment_index = line.index_of_char('#')
                        if comment_index != -1
                            comment = line.substring(comment_index)

                        if value == AllowedUsers.ROOT_ONLY
                            line = "allowed_users=rootonly"
                        else if value == AllowedUsers.CONSOLE
                            line = "allowed_users=console"
                        else if value == AllowedUsers.ANYBODY
                            line = "allowed_users=anybody"
                        else
                            break
                        
                        if comment is not null
                            line += " " + comment
                        
                        i.@set(line)
                        break
            
        def new save() raises Error
            if is_admin()
                super.save()
            else
                revoke_administrative_privileges()
                    
                var allowed_users = self.allowed_users
                if allowed_users == AllowedUsers.ROOT_ONLY
                    set_xwrapper_allowed_users("rootonly")
                else if allowed_users == AllowedUsers.CONSOLE
                    set_xwrapper_allowed_users("console")
                else if allowed_users == AllowedUsers.ANYBODY
                    set_xwrapper_allowed_users("anybody")
                    
                revoke_administrative_privileges()

        enum AllowedUsers
            UNKNOWN   = 0
            ROOT_ONLY = 1
            CONSOLE   = 2
            ANYBODY   = 3
