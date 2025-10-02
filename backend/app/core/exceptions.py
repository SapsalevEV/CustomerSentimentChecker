"""Custom application exceptions."""


class ApplicationException(Exception):
    """Base application exception."""
    
    def __init__(self, message: str, status_code: int = 500):
        """Initialize exception.
        
        Args:
            message: Error message
            status_code: HTTP status code
        """
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class DatabaseException(ApplicationException):
    """Database operation errors."""
    
    def __init__(self, message: str):
        """Initialize database exception.
        
        Args:
            message: Error message
        """
        super().__init__(message, status_code=500)


class NotFoundException(ApplicationException):
    """Resource not found error."""
    
    def __init__(self, message: str = "Resource not found"):
        """Initialize not found exception.
        
        Args:
            message: Error message
        """
        super().__init__(message, status_code=404)


class ValidationException(ApplicationException):
    """Data validation errors."""
    
    def __init__(self, message: str):
        """Initialize validation exception.
        
        Args:
            message: Error message
        """
        super().__init__(message, status_code=422)

