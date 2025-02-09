from django.core.files.storage import FileSystemStorage

class OverwriteStorage(FileSystemStorage):
    def get_available_name(self, name, max_length=None):
        # If a file with this name exists, delete it.
        if self.exists(name):
            self.delete(name)
        return name
