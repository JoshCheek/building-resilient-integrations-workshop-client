require 'rest-client'
require 'json'

class Resilint
  def self.registered(opts)
    opts[:user_id] ||= begin
      user_id = register(opts.fetch(:base_url), opts.fetch(:user_name))
      opts.fetch(:post_registration, Proc.new {}).call(user_id)
      user_id
    end
    new(opts)
  end

  def self.register(base_url, user_name)
    json = RestClient.post "#{base_url}/v1/register?userName=#{user_name}", {}
    body = JSON.parse(json)
    body.fetch 'user'
  end

  attr_accessor :base_url, :user_id, :user_name

  def initialize(opts)
    self.base_url  = opts.fetch :base_url
    self.user_id   = opts.fetch :user_id
    self.user_name = opts.fetch :user_name
  end
end
