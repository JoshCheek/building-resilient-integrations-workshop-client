require 'resilint'
require 'webmock/rspec'

RSpec.describe 'Resilint' do
  let(:base_url)        { 'http://localhost:1234/test-base-url' }
  let(:user_id)         { 'test-user-id' }
  let(:client)          { client_for({}) }
  let(:default_timeout) { 10 }

  def client_for(**options)
    options.key?(:base_url)  or options[:base_url]  = base_url
    options.key?(:user_name) or options[:user_name] = 'test-username'
    options.key?(:user_id)   or options[:user_id]   = user_id
    options.key?(:timeout)   or options[:timeout]   = default_timeout
    Resilint.registered(**options)
  end

  def stub_registration!
    stub_request(:post, "#{base_url}/v1/register?userName=#{user_name}")
      .to_return(status: 200, body: "{\"user\":\"#{returned_user_id}\",\"name\":\"#{user_name}\"}")
  end

  def stub_excavation!(bucket_id)
    stub_request(:post, "#{base_url}/v1/excavate")
      .to_return(status: 200, body: "{\"bucketId\":\"#{bucket_id}\",\"gold\":{\"units\":4}}")
  end

  def stub_storing!(bucket_id, body)
    stub_request(:post, "#{base_url}/v1/store?userId=#{user_id}&bucketId=#{bucket_id}")
      .to_return(status: 200, body: body)
  end

  def http_timeout!(seconds)
    expect(RestClient::Request).to receive(:execute) { |args|
      expect(args.fetch :timeout).to eq seconds
      raise RestClient::Exceptions::ReadTimeout,
            "Timed out reading data from server"
    }
  end

  it 'uses the provided base_url' do
    r = client_for(base_url: 'http://example.com/base-url')
    expect(r.base_url).to eq 'http://example.com/base-url'
  end

  it 'remembers the user_name it was created with' do
    r = client_for(user_name: 'JoshCheek')
    expect(r.user_name).to eq 'JoshCheek'
  end

  describe 'user_id' do
    let(:user_name)        { 'JoshCheek' }
    let(:returned_user_id) { 'returned-user-id' }

    it 'uses the provided user_id' do
      r = client_for(user_id: 'abc123')
      expect(r.user_id).to eq 'abc123'
    end

    it 'registers a user, based off the user_name, if no id was provided' do
      stub_registration!
      r = client_for(user_id: nil, user_name: user_name)
      expect(r.user_id).to eq returned_user_id
    end

    it 'calls the post_registration hook after registering' do
      stub_registration!
      id = nil
      client_for(user_id: nil, user_name: user_name, post_registration: lambda { |registered_id|
        id = registered_id
      })
      expect(id).to eq returned_user_id
    end
  end


  describe 'excavate (dig for gold)' do
    let(:returned_bucket_id) { 'test-bucket-id' }

    it 'posts to the excavate endpoint and returns the bucket id' do
      stub_excavation! returned_bucket_id
      expect(client.excavate).to eq returned_bucket_id
    end

    it 'times out after the specified number of seconds, returning nil' do
      http_timeout! 123
      expect(client_for(timeout: 123).excavate).to eq nil
    end
  end

  describe 'storing' do
    let(:bucket_id) { "buckets-of-fun" }

    it 'posts to the store endpoint and returns true if the endpoint indicates it was stored' do
      stub_storing! bucket_id, 'true'
      expect(client.store bucket_id).to eq true
    end

    it 'explodes if the body did not return true' do
      stub_storing! bucket_id, 'not the string "true"'
      expect { client.store bucket_id }.to raise_error NotImplementedError, /not the string/
    end

    it 'times out after the specified number of seconds, returning nil' do
      http_timeout! 123
      expect(client_for(timeout: 123).store(bucket_id)).to eq nil
    end
  end
end
