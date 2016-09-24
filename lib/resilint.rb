require 'rest-client'
require 'json'


class Resilint
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
    json = RestClient::Request.execute(
      method:  :post,
      url:     "#{base_url}/v1/excavate",
      timeout: timeout,
    )
    # => {"bucketId"=>"499728b5-c311-4c59-ac3d-132686dfa036", "gold"=>{"units"=>4}}
    body = JSON.parse(json)
    body.fetch 'bucketId'
  rescue RestClient::Exceptions::ReadTimeout
  end

  def store(bucket_id)
    body = RestClient.post "#{base_url}/v1/store?userId=#{user_id}&bucketId=#{bucket_id}", {}
    body == 'true' or raise(body)
  end

  private

  def register
    json = RestClient.post "#{base_url}/v1/register?userName=#{user_name}", {}
    # => "{\"user\":\"e707b38c-1d53-4be2-a4c7-dd3fc9fc77b8\",\"name\":\"JoshCheek\"}"
    body = JSON.parse(json)
    user_id = body.fetch 'user'
    post_registration.call(user_id)
    user_id
  end
end
