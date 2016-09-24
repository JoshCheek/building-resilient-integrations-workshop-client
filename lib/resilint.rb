require 'rest-client'
require 'json'


class Resilint
  RequestFailed = Class.new RuntimeError

  def self.registered(opts)
    new(opts)
  end

  attr_accessor :base_url, :user_id, :user_name, :timeout, :post_registration

  def initialize(opts)
    self.base_url          = opts.fetch :base_url
    self.user_name         = opts.fetch :user_name
    self.timeout           = opts.fetch :timeout
    self.post_registration = opts.fetch :post_registration, Proc.new {}
    self.user_id           = opts[:user_id] || register
  end

  def excavate
    # { bucketId: "499728b5-c311", gold: {units: 4} }
    request("excavate").fetch('bucketId')
  rescue RequestFailed
  end

  def store(bucket_id)
    body = request 'store', parse: false, params: {userId: user_id, bucketId: bucket_id}
    body == 'true' or raise NotImplementedError, "Body: #{body.to_s.inspect}"
  rescue RequestFailed
  end

  private

  def register
    # => { user: "e707b38c-1d53", name: "JoshCheek" }
    body    = request 'register', params: {userName: user_name}
    user_id = body.fetch 'user'
    post_registration.call(user_id)
    user_id
  end

  def request(path, params:{}, timeout: self.timeout, parse: true)
    body = RestClient::Request.execute(
      method:  :post,
      url:     "#{base_url}/v1/#{path}?#{to_query params}",
      timeout: timeout,
    )
    parse ? JSON.parse(body) : body
  rescue RestClient::RequestFailed
    raise RequestFailed, "after #{timeout}s"
  end

  def to_query(params)
    params.map { |k, v| "#{k}=#{v}" }.join("&")
  end
end
