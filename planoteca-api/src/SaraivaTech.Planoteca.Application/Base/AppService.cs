using SaraivaTech.Planoteca.Domain.Base.Interfaces;


namespace SaraivaTech.Planoteca.Application.Base
{
    public abstract class AppService
    {
        protected AppService(IUnitOfWork uoW)
        {
            UoW = uoW;
        }

        protected IUnitOfWork UoW { get; set; }
    }
}
