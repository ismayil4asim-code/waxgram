function Error({ statusCode }: { statusCode: number }) {
  return (
    <div>
      <p>{statusCode === 404 ? 'Страница не найдена' : 'Произошла ошибка'}</p>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default Error
