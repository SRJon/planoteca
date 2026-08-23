using FluentValidation;
using Microsoft.AspNetCore.Http;
using SaraivaTech.Planoteca.Application.Base;
using Serilog;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace SaraivaTech.Planoteca.Infra.CrossCutting.Middleware
{
    public class InterceptorHandlingMiddleware : IMiddleware
    {

        private ILogger _logger { get; }

        public InterceptorHandlingMiddleware(ILogger logger)
        {
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, RequestDelegate next)
        {
            try
            {
                if (context.Request != null)
                {
                    _logger.Debug("Query: {@Request}, ", context.Request);
                }


                var userLangs = context.Request.Headers.AcceptLanguage.ToString();
                var lags = userLangs.Split(',');

                if (lags.Length > 0)
                {
                    string language = lags[0];
                    var culture = CultureInfo.CreateSpecificCulture(language);

                    Thread.CurrentThread.CurrentCulture = culture;
                    Thread.CurrentThread.CurrentUICulture = culture;
                }

                await next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex, this._logger);
            }
        }



        private static Task HandleExceptionAsync(HttpContext context, Exception exception, ILogger logger)
        {
            var code = HttpStatusCode.InternalServerError; // 500 if unexpected
            var mensages = new List<string>();


            if (exception is NotImplementedException) code = HttpStatusCode.NotImplemented;
            else if (exception is UnauthorizedAccessException) code = HttpStatusCode.Unauthorized;
            else if (exception is ValidationException validationException)
            {
                code = HttpStatusCode.BadRequest;
                foreach (var item in validationException.Errors)
                {
                    logger.Warning(item.ErrorMessage);
                }
                mensages.AddRange(validationException.Errors.Select(item => item.ErrorMessage));
            }

            if (mensages.Count == 0)
            {

                mensages.Add(exception.Message);
                Console.WriteLine(exception.ToString());
                logger.Fatal(exception, exception.Message);
            }

            var result = JsonSerializer.Serialize(new Error() { status = (int)code, messages = mensages });

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)code;
            return context.Response.WriteAsync(result);
        }


    }
}