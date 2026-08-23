using SaraivaTech.Planoteca.Application.Base;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Collections.Generic;
using System.Linq;

namespace SaraivaTech.Planoteca.Api.Filters
{
    public class StandardErrorResultFilter : IResultFilter
    {
        public void OnResultExecuted(ResultExecutedContext context)
        {
        }

        public void OnResultExecuting(ResultExecutingContext context)
        {
            if (context.Result is ObjectResult objectResult)
            {
                HandleObjectResult(context, objectResult);
            }
            else if (context.Result is StatusCodeResult statusCodeResult && statusCodeResult.StatusCode >= 400)
            {
                HandleStatusCodeResult(context, statusCodeResult);
            }
        }

        private static void HandleObjectResult(ResultExecutingContext context, ObjectResult objectResult)
        {
            if (objectResult.StatusCode is not >= 400) return;

            var messages = ExtractMessages(objectResult.Value);
            if (messages == null) return; // Ja e um Error, nao faz nada

            var status = objectResult.StatusCode.Value;
            context.Result = new ObjectResult(new Error { status = status, messages = messages })
            {
                StatusCode = status
            };
        }

        private static void HandleStatusCodeResult(ResultExecutingContext context, StatusCodeResult statusCodeResult)
        {
            var errorResponse = new Error
            {
                status = statusCodeResult.StatusCode,
                messages = new List<string> { "An error occurred." }
            };

            context.Result = new ObjectResult(errorResponse)
            {
                StatusCode = statusCodeResult.StatusCode
            };
        }

        private static List<string>? ExtractMessages(object? value)
        {
            switch (value)
            {
                case string message:
                    return new List<string> { message };
                case IEnumerable<string> messageList:
                    return messageList.ToList();
                case ValidationProblemDetails validationProblem:
                    return validationProblem.Errors.SelectMany(error => error.Value).ToList();
                case ProblemDetails problemDetails:
                    return new List<string> { problemDetails.Title ?? "An error occurred." };
                case Error:
                    return null; // Ja e um Error, sinaliza para nao sobrescrever
                default:
                    return new List<string> { "An error occurred." };
            }
        }
    }
}
