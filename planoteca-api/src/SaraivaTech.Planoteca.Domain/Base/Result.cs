#nullable enable

namespace SaraivaTech.Planoteca.Domain.Base
{
    public class Result
    {
        public bool IsSuccess { get; }
        public ResultError? Error { get; }

        protected Result(bool isSuccess, ResultError? error)
        {
            IsSuccess = isSuccess;
            Error = error;
        }

        public static Result Success() => new(true, null);
        public static Result Failure(string message) => new(false, new ResultError("ERROR", message));
        public static Result Failure(string code, string message) => new(false, new ResultError(code, message));
    }

    public class Result<T> : Result
    {
        public T? Value { get; }

        private Result(bool isSuccess, T? value, ResultError? error) : base(isSuccess, error)
        {
            Value = value;
        }

        public static Result<T> Success(T value) => new(true, value, null);
        public new static Result<T> Failure(string message) => new(false, default, new ResultError("ERROR", message));
        public new static Result<T> Failure(string code, string message) => new(false, default, new ResultError(code, message));
    }

    public record ResultError(string Code, string Message);
}
